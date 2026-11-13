/**
 * Persistência MySQL dos dados do piloto.
 *
 * O catálogo administrativo tem repositório próprio; aqui ficam solicitações,
 * usuários, sessões, configurações e a sequência de protocolos. A leitura é
 * feita uma vez na inicialização e mantida em cache pelo `estado.js`; as
 * gravações são pontuais e aguardadas pela camada de serviço, para que a
 * resposta HTTP só seja enviada depois do commit.
 *
 * Sem configuração de banco o módulo não é usado: o piloto continua com o
 * arquivo JSON local (desenvolvimento e testes).
 */
import { obterPool } from './mysql.js'

const TABELAS = [
  `CREATE TABLE IF NOT EXISTS dados_solicitacoes (
    protocolo VARCHAR(32) NOT NULL PRIMARY KEY,
    tipo VARCHAR(64) NOT NULL,
    tipo_titulo VARCHAR(180) NOT NULL,
    descricao TEXT NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    contato VARCHAR(180) NULL,
    status VARCHAR(24) NOT NULL,
    criado_em DATETIME(3) NOT NULL,
    atualizado_em DATETIME(3) NOT NULL,
    concluido_em DATETIME(3) NULL,
    prazo_dias INT UNSIGNED NOT NULL DEFAULT 10,
    sla_em DATETIME(3) NOT NULL,
    prioridade VARCHAR(16) NOT NULL DEFAULT 'normal',
    foto MEDIUMTEXT NULL,
    localizacao JSON NULL,
    avaliacao JSON NULL,
    client_id VARCHAR(80) NULL,
    setor_id VARCHAR(64) NULL,
    transferencias JSON NULL,
    triagem JSON NULL,
    codigo_acesso_hash CHAR(64) NULL,
    historico JSON NOT NULL,
    KEY idx_dados_solicitacoes_criado (criado_em),
    KEY idx_dados_solicitacoes_setor (setor_id),
    KEY idx_dados_solicitacoes_status (status),
    UNIQUE KEY uq_dados_solicitacoes_client (client_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS dados_usuarios (
    id VARCHAR(80) NOT NULL PRIMARY KEY,
    nome VARCHAR(180) NOT NULL,
    email VARCHAR(180) NOT NULL,
    senha_hash VARCHAR(255) NULL,
    papel VARCHAR(16) NOT NULL,
    setor_id VARCHAR(64) NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME(3) NOT NULL,
    UNIQUE KEY uq_dados_usuarios_email (email),
    KEY idx_dados_usuarios_setor (setor_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS dados_sessoes (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    usuario_id VARCHAR(80) NOT NULL,
    lembrar TINYINT(1) NOT NULL DEFAULT 0,
    criada_em DATETIME(3) NOT NULL,
    expira_em DATETIME(3) NOT NULL,
    KEY idx_dados_sessoes_expira (expira_em),
    KEY idx_dados_sessoes_usuario (usuario_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS dados_cidadaos (
    id VARCHAR(80) NOT NULL PRIMARY KEY,
    nome VARCHAR(180) NOT NULL,
    email VARCHAR(180) NOT NULL,
    senha_hash VARCHAR(255) NULL,
    telefone VARCHAR(20) NOT NULL DEFAULT '',
    cep CHAR(8) NOT NULL DEFAULT '',
    logradouro VARCHAR(180) NOT NULL DEFAULT '',
    numero VARCHAR(20) NOT NULL DEFAULT '',
    complemento VARCHAR(80) NULL,
    bairro VARCHAR(120) NOT NULL DEFAULT '',
    cidade VARCHAR(120) NOT NULL DEFAULT '',
    uf CHAR(2) NOT NULL DEFAULT '',
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    consentimento_em DATETIME(3) NULL,
    consentimento_versao VARCHAR(20) NULL,
    removido_em DATETIME(3) NULL,
    criado_em DATETIME(3) NOT NULL,
    atualizado_em DATETIME(3) NOT NULL,
    UNIQUE KEY uq_dados_cidadaos_email (email),
    KEY idx_dados_cidadaos_ativo (ativo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS dados_cidadaos_sessoes (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    cidadao_id VARCHAR(80) NOT NULL,
    lembrar TINYINT(1) NOT NULL DEFAULT 0,
    criada_em DATETIME(3) NOT NULL,
    expira_em DATETIME(3) NOT NULL,
    KEY idx_dados_cidadaos_sessoes_expira (expira_em),
    KEY idx_dados_cidadaos_sessoes_cidadao (cidadao_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS dados_configuracoes (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    dados JSON NOT NULL,
    atualizado_em DATETIME(3) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS dados_meta (
    chave VARCHAR(64) NOT NULL PRIMARY KEY,
    valor VARCHAR(255) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
]

function paraData(valor) {
  return valor ? new Date(valor) : null
}

function paraIso(valor) {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data.toISOString()
}

function paraJson(valor) {
  return valor === undefined || valor === null ? null : JSON.stringify(valor)
}

export function lerJson(valor, padrao = null) {
  if (valor === null || valor === undefined) return padrao
  if (typeof valor !== 'string') return valor
  try {
    return JSON.parse(valor)
  } catch {
    return padrao
  }
}

function mapearSolicitacao(linha) {
  return {
    protocolo: linha.protocolo,
    tipo: linha.tipo,
    tipoTitulo: linha.tipo_titulo,
    descricao: linha.descricao,
    endereco: linha.endereco,
    contato: linha.contato,
    status: linha.status,
    criadoEm: paraIso(linha.criado_em),
    atualizadoEm: paraIso(linha.atualizado_em),
    ...(linha.concluido_em ? { concluidoEm: paraIso(linha.concluido_em) } : {}),
    prazoDias: Number(linha.prazo_dias),
    slaEm: paraIso(linha.sla_em),
    prioridade: linha.prioridade,
    foto: linha.foto,
    localizacao: lerJson(linha.localizacao),
    avaliacao: lerJson(linha.avaliacao),
    clientId: linha.client_id,
    setorId: linha.setor_id,
    transferencias: lerJson(linha.transferencias, []),
    triagem: lerJson(linha.triagem),
    codigoAcessoHash: linha.codigo_acesso_hash,
    historico: lerJson(linha.historico, []),
  }
}

function mapearUsuario(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senha_hash,
    papel: linha.papel,
    setorId: linha.setor_id,
    ativo: Boolean(linha.ativo),
    criadoEm: paraIso(linha.criado_em),
  }
}

function mapearCidadao(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senha_hash,
    telefone: linha.telefone,
    cep: linha.cep,
    logradouro: linha.logradouro,
    numero: linha.numero,
    complemento: linha.complemento,
    bairro: linha.bairro,
    cidade: linha.cidade,
    uf: linha.uf,
    ativo: Boolean(linha.ativo),
    consentimentoEm: paraIso(linha.consentimento_em),
    consentimentoVersao: linha.consentimento_versao,
    removidoEm: paraIso(linha.removido_em),
    criadoEm: paraIso(linha.criado_em),
    atualizadoEm: paraIso(linha.atualizado_em),
  }
}

function mapearSessaoCidadao(linha) {
  return {
    tokenHash: linha.token_hash,
    cidadaoId: linha.cidadao_id,
    lembrar: Boolean(linha.lembrar),
    criadaEm: paraIso(linha.criada_em),
    expiraEm: paraIso(linha.expira_em),
  }
}

function mapearSessao(linha) {
  return {
    tokenHash: linha.token_hash,
    usuarioId: linha.usuario_id,
    lembrar: Boolean(linha.lembrar),
    criadaEm: paraIso(linha.criada_em),
    expiraEm: paraIso(linha.expira_em),
  }
}

async function emTransacao(operacao) {
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

export async function inicializarTabelas() {
  const pool = obterPool()
  for (const sql of TABELAS) {
    await pool.query(sql)
  }
}

/** Lê todo o estado persistido. `vazio` indica banco ainda sem dados. */
export async function carregarTudo() {
  const pool = obterPool()
  await pool.query('DELETE FROM dados_sessoes WHERE expira_em <= UTC_TIMESTAMP(3)')
  await pool.query('DELETE FROM dados_cidadaos_sessoes WHERE expira_em <= UTC_TIMESTAMP(3)')

  const [solicitacoes] = await pool.query(
    'SELECT * FROM dados_solicitacoes ORDER BY criado_em DESC',
  )
  const [usuarios] = await pool.query('SELECT * FROM dados_usuarios ORDER BY criado_em ASC')
  const [sessoes] = await pool.query('SELECT * FROM dados_sessoes WHERE expira_em > UTC_TIMESTAMP(3)')
  const [configuracoes] = await pool.query(
    'SELECT * FROM dados_configuracoes WHERE id = 1 LIMIT 1',
  )
  const [cidadaos] = await pool.query('SELECT * FROM dados_cidadaos ORDER BY criado_em ASC')
  const [sessoesCidadao] = await pool.query(
    'SELECT * FROM dados_cidadaos_sessoes WHERE expira_em > UTC_TIMESTAMP(3)',
  )
  const [meta] = await pool.query("SELECT valor FROM dados_meta WHERE chave = 'sequencia' LIMIT 1")

  return {
    vazio: solicitacoes.length === 0 && usuarios.length === 0,
    solicitacoes: solicitacoes.map(mapearSolicitacao),
    usuarios: usuarios.map(mapearUsuario),
    sessoes: sessoes.map(mapearSessao),
    cidadaos: cidadaos.map(mapearCidadao),
    sessoesCidadao: sessoesCidadao.map(mapearSessaoCidadao),
    configuracoes: configuracoes[0]
      ? lerJson(configuracoes[0].dados, null)
      : null,
    sequencia: Number(meta[0]?.valor) || 0,
  }
}

const INSERT_SOLICITACAO = `INSERT INTO dados_solicitacoes
  (protocolo, tipo, tipo_titulo, descricao, endereco, contato, status, criado_em,
   atualizado_em, concluido_em, prazo_dias, sla_em, prioridade, foto, localizacao,
   avaliacao, client_id, setor_id, transferencias, triagem, codigo_acesso_hash, historico)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

function valoresSolicitacao(solicitacao) {
  return [
    solicitacao.protocolo,
    solicitacao.tipo,
    solicitacao.tipoTitulo,
    solicitacao.descricao,
    solicitacao.endereco,
    solicitacao.contato ?? null,
    solicitacao.status,
    paraData(solicitacao.criadoEm),
    paraData(solicitacao.atualizadoEm),
    paraData(solicitacao.concluidoEm),
    solicitacao.prazoDias,
    paraData(solicitacao.slaEm),
    solicitacao.prioridade,
    solicitacao.foto ?? null,
    paraJson(solicitacao.localizacao),
    paraJson(solicitacao.avaliacao),
    solicitacao.clientId ?? null,
    solicitacao.setorId ?? null,
    paraJson(solicitacao.transferencias ?? []),
    paraJson(solicitacao.triagem),
    solicitacao.codigoAcessoHash ?? null,
    paraJson(solicitacao.historico ?? []),
  ]
}

async function gravarSequencia(conexao, sequencia) {
  await conexao.execute(
    `INSERT INTO dados_meta (chave, valor) VALUES ('sequencia', ?)
     ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
    [String(sequencia)],
  )
}

export async function inserirSolicitacao(solicitacao, sequencia) {
  await emTransacao(async (conexao) => {
    await conexao.execute(INSERT_SOLICITACAO, valoresSolicitacao(solicitacao))
    await gravarSequencia(conexao, sequencia)
  })
}

export async function atualizarSolicitacao(solicitacao) {
  const pool = obterPool()
  const [resultado] = await pool.execute(
    `UPDATE dados_solicitacoes SET
       tipo = ?, tipo_titulo = ?, descricao = ?, endereco = ?, contato = ?, status = ?,
       criado_em = ?, atualizado_em = ?, concluido_em = ?, prazo_dias = ?, sla_em = ?,
       prioridade = ?, foto = ?, localizacao = ?, avaliacao = ?, client_id = ?,
       setor_id = ?, transferencias = ?, triagem = ?, codigo_acesso_hash = ?, historico = ?
     WHERE protocolo = ?`,
    [...valoresSolicitacao(solicitacao).slice(1), solicitacao.protocolo],
  )
  if (resultado.affectedRows === 0) {
    throw new Error(`Solicitação ${solicitacao.protocolo} não existe no banco.`)
  }
}

export async function inserirUsuario(usuario) {
  const pool = obterPool()
  await pool.execute(
    `INSERT INTO dados_usuarios
      (id, nome, email, senha_hash, papel, setor_id, ativo, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      usuario.id,
      usuario.nome,
      usuario.email,
      usuario.senhaHash ?? null,
      usuario.papel,
      usuario.setorId ?? null,
      usuario.ativo ? 1 : 0,
      paraData(usuario.criadoEm),
    ],
  )
}

export async function removerUsuario(id) {
  const pool = obterPool()
  await pool.execute('DELETE FROM dados_usuarios WHERE id = ?', [id])
}

export async function atualizarUsuario(usuario) {
  const pool = obterPool()
  const [resultado] = await pool.execute(
    `UPDATE dados_usuarios
        SET nome = ?, email = ?, senha_hash = ?, papel = ?, setor_id = ?, ativo = ?
      WHERE id = ?`,
    [
      usuario.nome,
      usuario.email,
      usuario.senhaHash ?? null,
      usuario.papel,
      usuario.setorId ?? null,
      usuario.ativo ? 1 : 0,
      usuario.id,
    ],
  )
  if (resultado.affectedRows === 0) {
    throw new Error(`Usuário ${usuario.id} não existe no banco.`)
  }
}

export async function inserirSessao(sessao) {
  const pool = obterPool()
  await pool.execute(
    `INSERT INTO dados_sessoes (token_hash, usuario_id, lembrar, criada_em, expira_em)
     VALUES (?, ?, ?, ?, ?)`,
    [
      sessao.tokenHash,
      sessao.usuarioId,
      sessao.lembrar ? 1 : 0,
      paraData(sessao.criadaEm),
      paraData(sessao.expiraEm),
    ],
  )
}

export async function removerSessao(tokenHash) {
  const pool = obterPool()
  await pool.execute('DELETE FROM dados_sessoes WHERE token_hash = ?', [tokenHash])
}

const INSERT_CIDADAO = `INSERT INTO dados_cidadaos
  (id, nome, email, senha_hash, telefone, cep, logradouro, numero, complemento,
   bairro, cidade, uf, ativo, consentimento_em, consentimento_versao, removido_em,
   criado_em, atualizado_em)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

function valoresCidadao(cidadao) {
  return [
    cidadao.id,
    cidadao.nome,
    cidadao.email,
    cidadao.senhaHash ?? null,
    cidadao.telefone ?? '',
    cidadao.cep ?? '',
    cidadao.logradouro ?? '',
    cidadao.numero ?? '',
    cidadao.complemento ?? null,
    cidadao.bairro ?? '',
    cidadao.cidade ?? '',
    cidadao.uf ?? '',
    cidadao.ativo ? 1 : 0,
    paraData(cidadao.consentimentoEm),
    cidadao.consentimentoVersao ?? null,
    paraData(cidadao.removidoEm),
    paraData(cidadao.criadoEm),
    paraData(cidadao.atualizadoEm),
  ]
}

export async function inserirCidadao(cidadao) {
  const pool = obterPool()
  await pool.execute(INSERT_CIDADAO, valoresCidadao(cidadao))
}

export async function atualizarCidadao(cidadao) {
  const pool = obterPool()
  const [resultado] = await pool.execute(
    `UPDATE dados_cidadaos SET
       nome = ?, email = ?, senha_hash = ?, telefone = ?, cep = ?, logradouro = ?,
       numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ?, ativo = ?,
       consentimento_em = ?, consentimento_versao = ?, removido_em = ?, atualizado_em = ?
     WHERE id = ?`,
    [
      cidadao.nome,
      cidadao.email,
      cidadao.senhaHash ?? null,
      cidadao.telefone ?? '',
      cidadao.cep ?? '',
      cidadao.logradouro ?? '',
      cidadao.numero ?? '',
      cidadao.complemento ?? null,
      cidadao.bairro ?? '',
      cidadao.cidade ?? '',
      cidadao.uf ?? '',
      cidadao.ativo ? 1 : 0,
      paraData(cidadao.consentimentoEm),
      cidadao.consentimentoVersao ?? null,
      paraData(cidadao.removidoEm),
      paraData(cidadao.atualizadoEm),
      cidadao.id,
    ],
  )
  if (resultado.affectedRows === 0) {
    throw new Error(`Cidadão ${cidadao.id} não existe no banco.`)
  }
}

export async function inserirSessaoCidadao(sessao) {
  const pool = obterPool()
  await pool.execute(
    `INSERT INTO dados_cidadaos_sessoes
      (token_hash, cidadao_id, lembrar, criada_em, expira_em)
     VALUES (?, ?, ?, ?, ?)`,
    [
      sessao.tokenHash,
      sessao.cidadaoId,
      sessao.lembrar ? 1 : 0,
      paraData(sessao.criadaEm),
      paraData(sessao.expiraEm),
    ],
  )
}

export async function removerSessaoCidadao(tokenHash) {
  const pool = obterPool()
  await pool.execute('DELETE FROM dados_cidadaos_sessoes WHERE token_hash = ?', [tokenHash])
}

export async function removerSessoesDoCidadao(cidadaoId) {
  const pool = obterPool()
  await pool.execute('DELETE FROM dados_cidadaos_sessoes WHERE cidadao_id = ?', [cidadaoId])
}

export async function salvarConfiguracoes(configuracoes) {
  const pool = obterPool()
  await pool.execute(
    `INSERT INTO dados_configuracoes (id, dados, atualizado_em)
     VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE dados = VALUES(dados), atualizado_em = VALUES(atualizado_em)`,
    [JSON.stringify(configuracoes), paraData(new Date())],
  )
}

/**
 * Primeira carga do banco: importa o estado existente (arquivo JSON ou
 * sementes) em uma única transação. Só é chamado quando as tabelas estão
 * vazias, portanto não sobrescreve dados já migrados.
 */
export async function importarEstadoInicial(dados) {
  await emTransacao(async (conexao) => {
    for (const solicitacao of dados.solicitacoes) {
      await conexao.execute(INSERT_SOLICITACAO, valoresSolicitacao(solicitacao))
    }
    for (const usuario of dados.usuarios) {
      await conexao.execute(
        `INSERT INTO dados_usuarios
          (id, nome, email, senha_hash, papel, setor_id, ativo, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuario.id,
          usuario.nome,
          usuario.email,
          usuario.senhaHash ?? null,
          usuario.papel,
          usuario.setorId ?? null,
          usuario.ativo ? 1 : 0,
          paraData(usuario.criadoEm),
        ],
      )
    }
    for (const sessao of dados.sessoes) {
      await conexao.execute(
        `INSERT INTO dados_sessoes (token_hash, usuario_id, lembrar, criada_em, expira_em)
         VALUES (?, ?, ?, ?, ?)`,
        [
          sessao.tokenHash,
          sessao.usuarioId,
          sessao.lembrar ? 1 : 0,
          paraData(sessao.criadaEm),
          paraData(sessao.expiraEm),
        ],
      )
    }
    for (const cidadao of dados.cidadaos ?? []) {
      await conexao.execute(INSERT_CIDADAO, valoresCidadao(cidadao))
    }
    for (const sessao of dados.sessoesCidadao ?? []) {
      await conexao.execute(
        `INSERT INTO dados_cidadaos_sessoes (token_hash, cidadao_id, lembrar, criada_em, expira_em)
         VALUES (?, ?, ?, ?, ?)`,
        [
          sessao.tokenHash,
          sessao.cidadaoId,
          sessao.lembrar ? 1 : 0,
          paraData(sessao.criadaEm),
          paraData(sessao.expiraEm),
        ],
      )
    }
    await conexao.execute(
      `INSERT INTO dados_configuracoes (id, dados, atualizado_em)
       VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE dados = VALUES(dados), atualizado_em = VALUES(atualizado_em)`,
      [JSON.stringify(dados.configuracoes), paraData(new Date())],
    )
    await gravarSequencia(conexao, dados.sequencia)
  })
}
