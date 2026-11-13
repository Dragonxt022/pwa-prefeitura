/**
 * Repositório dos avisos.
 *
 * Em produção usa MySQL; sem configuração de banco mantém uma cópia em memória
 * com as sementes, para desenvolvimento e testes. Regras de negócio ficam no
 * serviço; aqui só há leitura, gravação e auditoria.
 */
import { avisosSemente } from '../dominio/avisos.js'
import { mysqlConfigurado, obterPool } from './mysql.js'

const TABELAS = [
  `CREATE TABLE IF NOT EXISTS avisos (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    titulo VARCHAR(160) NOT NULL,
    resumo VARCHAR(300) NOT NULL,
    categoria VARCHAR(60) NOT NULL DEFAULT '',
    prioridade VARCHAR(16) NOT NULL DEFAULT 'normal',
    publicado_em DATETIME(3) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME(3) NOT NULL,
    atualizado_em DATETIME(3) NOT NULL,
    KEY idx_avisos_publicado (publicado_em),
    KEY idx_avisos_ativo (ativo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS avisos_auditoria (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    aviso_id VARCHAR(64) NOT NULL,
    acao VARCHAR(24) NOT NULL,
    dados_antes JSON NULL,
    dados_depois JSON NULL,
    usuario_id VARCHAR(80) NULL,
    usuario_nome VARCHAR(180) NULL,
    em DATETIME(3) NOT NULL,
    KEY idx_avisos_auditoria_em (em),
    KEY idx_avisos_auditoria_aviso (aviso_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
]

let memoria = null
let sequenciaAuditoria = 0

function dadosMemoria() {
  if (!memoria) {
    memoria = {
      avisos: avisosSemente.map((aviso) => ({ ...aviso })),
      auditoria: [],
    }
  }
  return memoria
}

function dataIso(valor) {
  if (!valor) return null
  return new Date(valor).toISOString()
}

function mapearAviso(linha) {
  return {
    id: linha.id,
    titulo: linha.titulo,
    resumo: linha.resumo,
    categoria: linha.categoria,
    prioridade: linha.prioridade,
    publicadoEm: dataIso(linha.publicado_em),
    ativo: Boolean(linha.ativo),
    criadoEm: dataIso(linha.criado_em),
    atualizadoEm: dataIso(linha.atualizado_em),
  }
}

function jsonAuditoria(valor) {
  if (typeof valor !== 'string') return valor ?? null
  try {
    return JSON.parse(valor)
  } catch {
    return null
  }
}

function mapearAuditoria(linha) {
  return {
    id: Number(linha.id),
    avisoId: linha.aviso_id,
    acao: linha.acao,
    dadosAntes: jsonAuditoria(linha.dados_antes),
    dadosDepois: jsonAuditoria(linha.dados_depois),
    usuarioId: linha.usuario_id,
    usuarioNome: linha.usuario_nome,
    em: dataIso(linha.em),
  }
}

async function semear(conexao) {
  const agora = new Date()
  for (const aviso of avisosSemente) {
    await conexao.execute(
      `INSERT IGNORE INTO avisos
        (id, titulo, resumo, categoria, prioridade, publicado_em, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        aviso.id,
        aviso.titulo,
        aviso.resumo,
        aviso.categoria ?? '',
        aviso.prioridade ?? 'normal',
        new Date(aviso.publicadoEm),
        aviso.ativo === false ? 0 : 1,
        agora,
        agora,
      ],
    )
  }
}

/** Cria o schema, insere sementes ausentes e devolve os avisos atuais. */
export async function inicializar() {
  if (!mysqlConfigurado) return carregar()
  const pool = obterPool()
  for (const sql of TABELAS) {
    await pool.query(sql)
  }
  await semear(pool)
  return carregar()
}

export async function carregar() {
  if (!mysqlConfigurado) {
    return dadosMemoria().avisos.map((aviso) => ({ ...aviso }))
  }
  const pool = obterPool()
  const [linhas] = await pool.query(
    'SELECT * FROM avisos ORDER BY publicado_em DESC, id ASC',
  )
  return linhas.map(mapearAviso)
}

export async function listarAuditoria(limite = 15) {
  const seguro = Math.max(1, Math.min(Number(limite) || 15, 100))
  if (!mysqlConfigurado) {
    return structuredClone(dadosMemoria().auditoria.slice(0, seguro))
  }
  const pool = obterPool()
  const [linhas] = await pool.query(
    'SELECT * FROM avisos_auditoria ORDER BY em DESC, id DESC LIMIT ?',
    [seguro],
  )
  return linhas.map(mapearAuditoria)
}

function registrarAuditoriaMemoria(acao, antes, depois, ator, em) {
  sequenciaAuditoria += 1
  dadosMemoria().auditoria.unshift({
    id: sequenciaAuditoria,
    avisoId: depois?.id ?? antes?.id,
    acao,
    dadosAntes: structuredClone(antes ?? null),
    dadosDepois: structuredClone(depois ?? null),
    usuarioId: ator?.id ?? null,
    usuarioNome: ator?.nome ?? null,
    em,
  })
}

async function emTransacao(operacao) {
  if (!mysqlConfigurado) return operacao(null)
  const pool = obterPool()
  const conexao = await pool.getConnection()
  try {
    await conexao.beginTransaction()
    const resultado = await operacao(conexao)
    await conexao.commit()
    return resultado
  } catch (erro) {
    await conexao.rollback()
    throw erro
  } finally {
    conexao.release()
  }
}

async function gravarAuditoria(conexao, acao, antes, depois, ator, em) {
  await conexao.execute(
    `INSERT INTO avisos_auditoria
      (aviso_id, acao, dados_antes, dados_depois, usuario_id, usuario_nome, em)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      depois?.id ?? antes?.id,
      acao,
      antes ? JSON.stringify(antes) : null,
      depois ? JSON.stringify(depois) : null,
      ator?.id ?? null,
      ator?.nome ?? null,
      new Date(em),
    ],
  )
}

export async function criar(registro, ator) {
  if (!mysqlConfigurado) {
    dadosMemoria().avisos.push(structuredClone(registro))
    registrarAuditoriaMemoria('criado', null, registro, ator, registro.criadoEm)
    return structuredClone(registro)
  }

  await emTransacao(async (conexao) => {
    await conexao.execute(
      `INSERT INTO avisos
        (id, titulo, resumo, categoria, prioridade, publicado_em, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.id,
        registro.titulo,
        registro.resumo,
        registro.categoria ?? '',
        registro.prioridade,
        new Date(registro.publicadoEm),
        registro.ativo ? 1 : 0,
        new Date(registro.criadoEm),
        new Date(registro.atualizadoEm),
      ],
    )
    await gravarAuditoria(conexao, 'criado', null, registro, ator, registro.atualizadoEm)
  })
  return registro
}

export async function atualizar(registro, antes, ator) {
  if (!mysqlConfigurado) {
    const dados = dadosMemoria()
    const indice = dados.avisos.findIndex((item) => item.id === registro.id)
    if (indice < 0) return null
    dados.avisos[indice] = structuredClone(registro)
    registrarAuditoriaMemoria('atualizado', antes, registro, ator, registro.atualizadoEm)
    return structuredClone(registro)
  }

  await emTransacao(async (conexao) => {
    await conexao.execute(
      `UPDATE avisos
          SET titulo = ?, resumo = ?, categoria = ?, prioridade = ?,
              publicado_em = ?, ativo = ?, atualizado_em = ?
        WHERE id = ?`,
      [
        registro.titulo,
        registro.resumo,
        registro.categoria ?? '',
        registro.prioridade,
        new Date(registro.publicadoEm),
        registro.ativo ? 1 : 0,
        new Date(registro.atualizadoEm),
        registro.id,
      ],
    )
    await gravarAuditoria(conexao, 'atualizado', antes, registro, ator, registro.atualizadoEm)
  })
  return registro
}

/** Usado nos testes para isolar o estado em memória. */
export function reiniciarMemoria() {
  memoria = null
  sequenciaAuditoria = 0
}
