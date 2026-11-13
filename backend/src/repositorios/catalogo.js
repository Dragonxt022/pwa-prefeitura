/**
 * Repositório do catálogo administrativo.
 *
 * Em produção usa MySQL; sem configuração de banco mantém uma cópia em memória
 * com as sementes, para desenvolvimento e testes. As regras de negócio ficam no
 * serviço; aqui só há leitura, gravação e auditoria.
 */
import {
  secretariasSemente,
  servicosSemente,
  setoresSemente,
} from '../dominio/catalogo.js'
import { mysqlConfigurado, obterPool } from './mysql.js'

const TABELAS = [
  `CREATE TABLE IF NOT EXISTS catalogo_secretarias (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    sigla VARCHAR(32) NOT NULL,
    nome VARCHAR(180) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    teste TINYINT(1) NOT NULL DEFAULT 0,
    criado_em DATETIME(3) NOT NULL,
    atualizado_em DATETIME(3) NOT NULL,
    UNIQUE KEY uq_catalogo_secretarias_sigla (sigla),
    UNIQUE KEY uq_catalogo_secretarias_slug (slug)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS catalogo_setores (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    nome VARCHAR(180) NOT NULL,
    descricao VARCHAR(255) NOT NULL DEFAULT '',
    secretaria_id VARCHAR(64) NULL,
    central TINYINT(1) NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME(3) NOT NULL,
    atualizado_em DATETIME(3) NOT NULL,
    KEY idx_catalogo_setores_secretaria (secretaria_id),
    CONSTRAINT fk_catalogo_setores_secretaria
      FOREIGN KEY (secretaria_id) REFERENCES catalogo_secretarias (id)
      ON UPDATE CASCADE ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS catalogo_servicos (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    titulo VARCHAR(180) NOT NULL,
    descricao VARCHAR(255) NOT NULL DEFAULT '',
    categoria VARCHAR(80) NOT NULL DEFAULT '',
    prazo_dias INT UNSIGNED NOT NULL DEFAULT 10,
    ordem INT NOT NULL DEFAULT 0,
    destaque TINYINT(1) NOT NULL DEFAULT 0,
    novo TINYINT(1) NOT NULL DEFAULT 0,
    setor_id VARCHAR(64) NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME(3) NOT NULL,
    atualizado_em DATETIME(3) NOT NULL,
    KEY idx_catalogo_servicos_setor (setor_id),
    KEY idx_catalogo_servicos_ordem (ordem),
    CONSTRAINT fk_catalogo_servicos_setor
      FOREIGN KEY (setor_id) REFERENCES catalogo_setores (id)
      ON UPDATE CASCADE ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS catalogo_meta (
    chave VARCHAR(64) NOT NULL PRIMARY KEY,
    valor VARCHAR(255) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS catalogo_auditoria (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    entidade VARCHAR(24) NOT NULL,
    entidade_id VARCHAR(64) NOT NULL,
    acao VARCHAR(24) NOT NULL,
    dados_antes JSON NULL,
    dados_depois JSON NULL,
    usuario_id VARCHAR(80) NULL,
    usuario_nome VARCHAR(180) NULL,
    em DATETIME(3) NOT NULL,
    KEY idx_catalogo_auditoria_em (em),
    KEY idx_catalogo_auditoria_entidade (entidade, entidade_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
]

let memoria = null
let sequenciaAuditoria = 0

function dadosMemoria() {
  if (!memoria) {
    memoria = {
      secretarias: structuredClone(secretariasSemente),
      setores: structuredClone(setoresSemente),
      servicos: structuredClone(servicosSemente),
      auditoria: [],
    }
  }
  return memoria
}

function dataIso(valor) {
  if (!valor) return null
  return new Date(valor).toISOString()
}

function mapearSecretaria(linha) {
  return {
    id: linha.id,
    sigla: linha.sigla,
    nome: linha.nome,
    slug: linha.slug,
    ativo: Boolean(linha.ativo),
    teste: Boolean(linha.teste),
    criadoEm: dataIso(linha.criado_em),
    atualizadoEm: dataIso(linha.atualizado_em),
  }
}

function mapearSetor(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    descricao: linha.descricao,
    secretariaId: linha.secretaria_id,
    central: Boolean(linha.central),
    ativo: Boolean(linha.ativo),
    criadoEm: dataIso(linha.criado_em),
    atualizadoEm: dataIso(linha.atualizado_em),
  }
}

function mapearServico(linha) {
  return {
    id: linha.id,
    titulo: linha.titulo,
    descricao: linha.descricao,
    categoria: linha.categoria,
    prazoDias: Number(linha.prazo_dias),
    ordem: Number(linha.ordem),
    destaque: Boolean(linha.destaque),
    novo: Boolean(linha.novo),
    setorId: linha.setor_id,
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
    entidade: linha.entidade,
    entidadeId: linha.entidade_id,
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
  for (const secretaria of secretariasSemente) {
    await conexao.execute(
      `INSERT IGNORE INTO catalogo_secretarias
        (id, sigla, nome, slug, ativo, teste, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        secretaria.id,
        secretaria.sigla,
        secretaria.nome,
        secretaria.slug,
        secretaria.ativo === false ? 0 : 1,
        secretaria.teste ? 1 : 0,
        agora,
        agora,
      ],
    )
  }

  for (const setor of setoresSemente) {
    await conexao.execute(
      `INSERT IGNORE INTO catalogo_setores
        (id, nome, descricao, secretaria_id, central, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        setor.id,
        setor.nome,
        setor.descricao ?? '',
        setor.secretariaId ?? null,
        setor.central ? 1 : 0,
        setor.ativo === false ? 0 : 1,
        agora,
        agora,
      ],
    )
  }

  for (const servico of servicosSemente) {
    await conexao.execute(
      `INSERT IGNORE INTO catalogo_servicos
        (id, titulo, descricao, categoria, prazo_dias, ordem, destaque, novo,
         setor_id, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        servico.id,
        servico.titulo,
        servico.descricao ?? '',
        servico.categoria ?? '',
        servico.prazoDias ?? 10,
        servico.ordem ?? 0,
        servico.destaque ? 1 : 0,
        servico.novo ? 1 : 0,
        servico.setorId ?? null,
        servico.ativo === false ? 0 : 1,
        agora,
        agora,
      ],
    )
  }
}

/**
 * Corrige com segurança dados que já existiam na versão anterior da semente.
 *
 * `INSERT IGNORE` não altera linhas existentes. Estas atualizações só rodam
 * quando o registro ainda está exatamente no estado antigo, preservando
 * qualquer edição feita pelo administrador:
 * - setores sem vínculo recebem a secretaria definida nesta versão;
 * - a secretaria de testes, nunca editada, é desativada por soft delete.
 */
async function ajustarSementes(conexao) {
  for (const setor of setoresSemente) {
    if (!setor.secretariaId) continue
    await conexao.execute(
      `UPDATE catalogo_setores
          SET secretaria_id = ?, atualizado_em = ?
        WHERE id = ? AND secretaria_id IS NULL`,
      [setor.secretariaId, new Date(), setor.id],
    )
  }

  // A desativação da secretaria de testes é uma migração única: usa um
  // marcador para não desfazer uma reativação deliberada feita depois.
  const testes = secretariasSemente.find((secretaria) => secretaria.teste)
  if (testes && testes.ativo === false) {
    const [marcador] = await conexao.execute(
      "SELECT valor FROM catalogo_meta WHERE chave = 'semente_testes_desativada' LIMIT 1",
    )
    if (marcador.length === 0) {
      await conexao.execute(
        `UPDATE catalogo_secretarias
            SET ativo = 0, atualizado_em = ?
          WHERE id = ? AND teste = 1`,
        [new Date(), testes.id],
      )
      await conexao.execute(
        `INSERT INTO catalogo_meta (chave, valor)
         VALUES ('semente_testes_desativada', '1')
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
      )
    }
  }
}

/** Cria o schema, insere sementes ausentes e devolve o catálogo atual. */
export async function inicializar() {
  if (!mysqlConfigurado) return carregar()
  const pool = obterPool()
  for (const sql of TABELAS) {
    await pool.query(sql)
  }
  await semear(pool)
  await ajustarSementes(pool)
  return carregar()
}

export async function carregar() {
  if (!mysqlConfigurado) {
    const dados = dadosMemoria()
    return {
      secretarias: structuredClone(dados.secretarias),
      setores: structuredClone(dados.setores),
      servicos: structuredClone(dados.servicos),
    }
  }

  const pool = obterPool()
  const [secretarias] = await pool.query(
    'SELECT * FROM catalogo_secretarias ORDER BY nome ASC',
  )
  const [setores] = await pool.query(
    'SELECT * FROM catalogo_setores ORDER BY central DESC, nome ASC',
  )
  const [servicos] = await pool.query(
    'SELECT * FROM catalogo_servicos ORDER BY ordem ASC, titulo ASC',
  )
  return {
    secretarias: secretarias.map(mapearSecretaria),
    setores: setores.map(mapearSetor),
    servicos: servicos.map(mapearServico),
  }
}

export async function listarAuditoria(limite = 15) {
  const seguro = Math.max(1, Math.min(Number(limite) || 15, 100))
  if (!mysqlConfigurado) {
    return structuredClone(dadosMemoria().auditoria.slice(0, seguro))
  }
  const pool = obterPool()
  const [linhas] = await pool.query(
    'SELECT * FROM catalogo_auditoria ORDER BY em DESC, id DESC LIMIT ?',
    [seguro],
  )
  return linhas.map(mapearAuditoria)
}

function usuarioAuditoria(ator) {
  return {
    id: ator?.id ?? null,
    nome: ator?.nome ?? null,
  }
}

function registrarAuditoriaMemoria(entidade, acao, antes, depois, ator, em) {
  sequenciaAuditoria += 1
  dadosMemoria().auditoria.unshift({
    id: sequenciaAuditoria,
    entidade,
    entidadeId: depois?.id ?? antes?.id,
    acao,
    dadosAntes: structuredClone(antes ?? null),
    dadosDepois: structuredClone(depois ?? null),
    usuarioId: ator?.id ?? null,
    usuarioNome: ator?.nome ?? null,
    em,
  })
}

async function gravarAuditoria(conexao, entidade, acao, antes, depois, ator, em) {
  const usuario = usuarioAuditoria(ator)
  await conexao.execute(
    `INSERT INTO catalogo_auditoria
      (entidade, entidade_id, acao, dados_antes, dados_depois, usuario_id, usuario_nome, em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entidade,
      depois?.id ?? antes?.id,
      acao,
      antes ? JSON.stringify(antes) : null,
      depois ? JSON.stringify(depois) : null,
      usuario.id,
      usuario.nome,
      new Date(em),
    ],
  )
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

export async function criarSecretaria(registro, ator) {
  if (!mysqlConfigurado) {
    dadosMemoria().secretarias.push(structuredClone(registro))
    registrarAuditoriaMemoria('secretaria', 'criado', null, registro, ator, registro.criadoEm)
    return structuredClone(registro)
  }

  await emTransacao(async (conexao) => {
    await conexao.execute(
      `INSERT INTO catalogo_secretarias
        (id, sigla, nome, slug, ativo, teste, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.id,
        registro.sigla,
        registro.nome,
        registro.slug,
        registro.ativo ? 1 : 0,
        registro.teste ? 1 : 0,
        new Date(registro.criadoEm),
        new Date(registro.atualizadoEm),
      ],
    )
    await gravarAuditoria(
      conexao, 'secretaria', 'criado', null, registro, ator, registro.atualizadoEm,
    )
  })
  return registro
}

export async function atualizarSecretaria(registro, antes, ator) {
  if (!mysqlConfigurado) {
    const dados = dadosMemoria()
    const indice = dados.secretarias.findIndex((item) => item.id === registro.id)
    if (indice < 0) return null
    dados.secretarias[indice] = structuredClone(registro)
    registrarAuditoriaMemoria('secretaria', 'atualizado', antes, registro, ator, registro.atualizadoEm)
    return structuredClone(registro)
  }

  await emTransacao(async (conexao) => {
    await conexao.execute(
      `UPDATE catalogo_secretarias
          SET sigla = ?, nome = ?, slug = ?, ativo = ?, teste = ?, atualizado_em = ?
        WHERE id = ?`,
      [
        registro.sigla,
        registro.nome,
        registro.slug,
        registro.ativo ? 1 : 0,
        registro.teste ? 1 : 0,
        new Date(registro.atualizadoEm),
        registro.id,
      ],
    )
    await gravarAuditoria(
      conexao, 'secretaria', 'atualizado', antes, registro, ator, registro.atualizadoEm,
    )
  })
  return registro
}

export async function criarSetor(registro, ator) {
  if (!mysqlConfigurado) {
    dadosMemoria().setores.push(structuredClone(registro))
    registrarAuditoriaMemoria('setor', 'criado', null, registro, ator, registro.criadoEm)
    return structuredClone(registro)
  }

  await emTransacao(async (conexao) => {
    await conexao.execute(
      `INSERT INTO catalogo_setores
        (id, nome, descricao, secretaria_id, central, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.id,
        registro.nome,
        registro.descricao ?? '',
        registro.secretariaId ?? null,
        registro.central ? 1 : 0,
        registro.ativo ? 1 : 0,
        new Date(registro.criadoEm),
        new Date(registro.atualizadoEm),
      ],
    )
    await gravarAuditoria(conexao, 'setor', 'criado', null, registro, ator, registro.atualizadoEm)
  })
  return registro
}

export async function atualizarSetor(registro, antes, ator) {
  if (!mysqlConfigurado) {
    const dados = dadosMemoria()
    const indice = dados.setores.findIndex((item) => item.id === registro.id)
    if (indice < 0) return null
    dados.setores[indice] = structuredClone(registro)
    registrarAuditoriaMemoria('setor', 'atualizado', antes, registro, ator, registro.atualizadoEm)
    return structuredClone(registro)
  }

  await emTransacao(async (conexao) => {
    await conexao.execute(
      `UPDATE catalogo_setores
          SET nome = ?, descricao = ?, secretaria_id = ?, central = ?, ativo = ?,
              atualizado_em = ?
        WHERE id = ?`,
      [
        registro.nome,
        registro.descricao ?? '',
        registro.secretariaId ?? null,
        registro.central ? 1 : 0,
        registro.ativo ? 1 : 0,
        new Date(registro.atualizadoEm),
        registro.id,
      ],
    )
    await gravarAuditoria(conexao, 'setor', 'atualizado', antes, registro, ator, registro.atualizadoEm)
  })
  return registro
}

export async function criarServico(registro, ator) {
  if (!mysqlConfigurado) {
    dadosMemoria().servicos.push(structuredClone(registro))
    registrarAuditoriaMemoria('servico', 'criado', null, registro, ator, registro.criadoEm)
    return structuredClone(registro)
  }

  await emTransacao(async (conexao) => {
    await conexao.execute(
      `INSERT INTO catalogo_servicos
        (id, titulo, descricao, categoria, prazo_dias, ordem, destaque, novo,
         setor_id, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.id,
        registro.titulo,
        registro.descricao ?? '',
        registro.categoria ?? '',
        registro.prazoDias,
        registro.ordem,
        registro.destaque ? 1 : 0,
        registro.novo ? 1 : 0,
        registro.setorId ?? null,
        registro.ativo ? 1 : 0,
        new Date(registro.criadoEm),
        new Date(registro.atualizadoEm),
      ],
    )
    await gravarAuditoria(conexao, 'servico', 'criado', null, registro, ator, registro.atualizadoEm)
  })
  return registro
}

export async function atualizarServico(registro, antes, ator) {
  if (!mysqlConfigurado) {
    const dados = dadosMemoria()
    const indice = dados.servicos.findIndex((item) => item.id === registro.id)
    if (indice < 0) return null
    dados.servicos[indice] = structuredClone(registro)
    registrarAuditoriaMemoria('servico', 'atualizado', antes, registro, ator, registro.atualizadoEm)
    return structuredClone(registro)
  }

  await emTransacao(async (conexao) => {
    await conexao.execute(
      `UPDATE catalogo_servicos
          SET titulo = ?, descricao = ?, categoria = ?, prazo_dias = ?, ordem = ?,
              destaque = ?, novo = ?, setor_id = ?, ativo = ?, atualizado_em = ?
        WHERE id = ?`,
      [
        registro.titulo,
        registro.descricao ?? '',
        registro.categoria ?? '',
        registro.prazoDias,
        registro.ordem,
        registro.destaque ? 1 : 0,
        registro.novo ? 1 : 0,
        registro.setorId ?? null,
        registro.ativo ? 1 : 0,
        new Date(registro.atualizadoEm),
        registro.id,
      ],
    )
    await gravarAuditoria(conexao, 'servico', 'atualizado', antes, registro, ator, registro.atualizadoEm)
  })
  return registro
}

/** Usado nos testes para isolar o estado em memória. */
export function reiniciarMemoria() {
  memoria = null
  sequenciaAuditoria = 0
}
