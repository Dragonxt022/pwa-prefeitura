/**
 * Fila de triagem persistida no MySQL.
 *
 * Um lock nomeado do MySQL garante que apenas um processo processe a fila por
 * vez, mesmo com várias instâncias do PM2. O job é gravado antes do modelo
 * responder, então um reinício não perde o pedido: os jobs órfãos voltam para
 * pendente na inicialização.
 */
import { obterPool } from './mysql.js'

const LOCK = 'pwa_triagem_fila'
const INTERVALO_ORFAO_MINUTOS = 5

function numero(valor) {
  return Number(valor) || 0
}

export async function enfileirar(protocolo) {
  const pool = obterPool()
  const [resultado] = await pool.execute(
    `INSERT IGNORE INTO dados_triagem_jobs
      (protocolo, status, tentativas, criado_em)
     VALUES (?, 'pendente', 0, ?)`,
    [protocolo, new Date()],
  )
  return { inserido: resultado.affectedRows === 1 }
}

export async function contar() {
  const pool = obterPool()
  const [[linha]] = await pool.query(
    `SELECT
       SUM(status = 'pendente') AS pendentes,
       SUM(status = 'processando') AS processando
     FROM dados_triagem_jobs
     WHERE status IN ('pendente', 'processando')`,
  )
  return {
    pendentes: numero(linha?.pendentes),
    processando: numero(linha?.processando),
  }
}

export async function recuperarOrfaos() {
  const pool = obterPool()
  await pool.execute(
    `UPDATE dados_triagem_jobs
        SET status = 'pendente', iniciado_em = NULL
      WHERE status = 'processando'
        AND (iniciado_em IS NULL OR iniciado_em < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? MINUTE))`,
    [INTERVALO_ORFAO_MINUTOS],
  )
}

export async function limparAntigos() {
  const pool = obterPool()
  await pool.query(
    `DELETE FROM dados_triagem_jobs
      WHERE status IN ('concluida', 'erro')
        AND concluido_em < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 DAY)`,
  )
}

/**
 * Executa uma unidade de trabalho sob o lock global.
 *
 * `operacao` recebe a conexão que mantém o lock e deve retornar `false` quando
 * não há job disponível. O lock fica preso durante a inferência para impedir
 * que outra instância processe em paralelo.
 */
async function comLockGlobal(operacao) {
  const pool = obterPool()
  const conexao = await pool.getConnection()
  try {
    const [[lock]] = await conexao.query('SELECT GET_LOCK(?, 0) AS ok', [LOCK])
    if (numero(lock?.ok) !== 1) return { executou: false, resultado: false }
    try {
      return { executou: true, resultado: await operacao(conexao) }
    } finally {
      await conexao.query('SELECT RELEASE_LOCK(?)', [LOCK])
    }
  } finally {
    conexao.release()
  }
}

export async function processarProximo(executor) {
  return comLockGlobal(async (conexao) => {
    const [linhas] = await conexao.query(
      `SELECT id, protocolo FROM dados_triagem_jobs
        WHERE status = 'pendente'
        ORDER BY id ASC
        LIMIT 1`,
    )
    const job = linhas[0]
    if (!job) return false

    await conexao.execute(
      `UPDATE dados_triagem_jobs
          SET status = 'processando', iniciado_em = ?, tentativas = tentativas + 1
        WHERE id = ? AND status = 'pendente'`,
      [new Date(), job.id],
    )

    try {
      await executor(job.protocolo)
      await conexao.execute(
        `UPDATE dados_triagem_jobs
            SET status = 'concluida', concluido_em = ?, erro = NULL
          WHERE id = ?`,
        [new Date(), job.id],
      )
    } catch (erro) {
      await conexao.execute(
        `UPDATE dados_triagem_jobs
            SET status = 'erro', concluido_em = ?, erro = ?
          WHERE id = ?`,
        [new Date(), String(erro?.message || 'falha').slice(0, 300), job.id],
      )
    }
    return true
  })
}
