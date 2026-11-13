/**
 * Regras de negócio do catálogo administrativo.
 *
 * O catálogo fica em cache na memória para preservar as consultas síncronas da
 * triagem e dos apresentadores. Toda alteração é gravada no repositório e o
 * cache é recarregado antes de responder.
 */
import {
  STATUS_ABERTOS,
  aplicarCatalogo,
  buscarSecretaria,
  buscarSetor,
  buscarServico,
  listarSecretarias,
  listarServicos,
  listarSetores,
} from '../dominio/catalogo.js'
import * as repositorioCatalogo from '../repositorios/catalogo.js'
import { mysqlConfigurado } from '../repositorios/mysql.js'
import * as repositorioSolicitacoes from '../repositorios/solicitacoes.js'

const LIMITE_AUDITORIA = 15

export function persistenciaAtual() {
  return mysqlConfigurado ? 'mysql' : 'memoria'
}

/** Carrega o catálogo do banco (ou da memória) antes de abrir a API. */
export async function inicializarCatalogo() {
  const dados = await repositorioCatalogo.inicializar()
  aplicarCatalogo(dados)
  return { ...dados, persistencia: persistenciaAtual() }
}

async function recarregar() {
  const dados = await repositorioCatalogo.carregar()
  aplicarCatalogo(dados)
  return dados
}

export function obterCatalogo() {
  return {
    secretarias: listarSecretarias({ incluirInativos: true }),
    setores: listarSetores({ incluirInativos: true }),
    servicos: listarServicos({ incluirInativos: true }),
    persistencia: persistenciaAtual(),
  }
}

export function listarAuditoriaCatalogo() {
  return repositorioCatalogo.listarAuditoria(LIMITE_AUDITORIA)
}

function baseId(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}

function gerarId(valor, existe) {
  const base = baseId(valor) || 'item'
  if (!existe(base)) return base
  for (let numero = 2; numero <= 999; numero += 1) {
    const candidato = `${base}_${numero}`.slice(0, 48)
    if (!existe(candidato)) return candidato
  }
  throw new Error('Não foi possível gerar um identificador único para o catálogo.')
}

function contarSolicitacoesAbertas(filtro) {
  return repositorioSolicitacoes
    .listarTodas()
    .filter((solicitacao) => STATUS_ABERTOS.includes(solicitacao.status) && filtro(solicitacao))
    .length
}

function mensagemSolicitacoesAbertas(quantidade, contexto) {
  return `${quantidade} solicitação(ões) aberta(s) ${contexto}. Conclua ou transfira antes de desativar.`
}

function duplicidadeSecretaria(dados, idAtual = null) {
  const campos = {}
  const secretarias = listarSecretarias({ incluirInativos: true })
  if (
    dados.sigla &&
    secretarias.some(
      (secretaria) =>
        secretaria.id !== idAtual &&
        secretaria.sigla.toUpperCase() === dados.sigla.toUpperCase(),
    )
  ) {
    campos.sigla = 'Já existe uma secretaria com esta sigla.'
  }
  if (
    dados.slug &&
    secretarias.some(
      (secretaria) => secretaria.id !== idAtual && secretaria.slug === dados.slug,
    )
  ) {
    campos.slug = 'Já existe uma secretaria com este slug.'
  }
  return campos
}

function validarSecretariaVinculada(secretariaId, campos, mensagem) {
  const secretaria = buscarSecretaria(secretariaId)
  if (!secretaria || !secretaria.ativo) {
    campos.secretariaId = mensagem || 'Escolha uma secretaria ativa.'
  }
}

function validarSetorVinculado(setorId, campos) {
  const setor = buscarSetor(setorId)
  if (!setor || !setor.ativo) {
    campos.setorId = 'Escolha um setor ativo.'
  }
}

function bloqueioDesativacaoSecretaria(secretaria) {
  const setores = listarSetores({ incluirInativos: true }).filter(
    (setor) => setor.secretariaId === secretaria.id,
  )
  const ids = new Set(setores.map((setor) => setor.id))
  const abertas = contarSolicitacoesAbertas((solicitacao) => ids.has(solicitacao.setorId))
  if (abertas > 0) {
    return {
      ativo: mensagemSolicitacoesAbertas(abertas, 'ainda estão nos setores desta secretaria'),
    }
  }
  const setoresAtivos = setores.filter((setor) => setor.ativo)
  if (setoresAtivos.length > 0) {
    return {
      ativo: 'Desative ou mova os setores ativos antes de desativar a secretaria.',
    }
  }
  return null
}

function bloqueioDesativacaoSetor(setor) {
  if (setor.central) {
    return { ativo: 'A triagem central não pode ser desativada.' }
  }
  const abertas = contarSolicitacoesAbertas(
    (solicitacao) => solicitacao.setorId === setor.id,
  )
  if (abertas > 0) {
    return {
      ativo: mensagemSolicitacoesAbertas(abertas, 'ainda estão vinculadas a este setor'),
    }
  }
  const servicosAtivos = listarServicos({ incluirInativos: true }).filter(
    (servico) => servico.setorId === setor.id && servico.ativo,
  )
  if (servicosAtivos.length > 0) {
    return {
      ativo: 'Desative ou mova os serviços ativos antes de desativar o setor.',
    }
  }
  return null
}

function bloqueioDesativacaoServico(servico) {
  const abertas = contarSolicitacoesAbertas(
    (solicitacao) => solicitacao.tipo === servico.id,
  )
  if (abertas > 0) {
    return {
      ativo: mensagemSolicitacoesAbertas(abertas, 'usam este serviço'),
    }
  }
  return null
}

function resultadoAtualizado(dados, registro) {
  return { registro: structuredClone(registro), ...dados }
}

export async function criarSecretaria(dados, ator) {
  const campos = duplicidadeSecretaria(dados)
  if (Object.keys(campos).length > 0) return { campos }

  const agora = new Date().toISOString()
  const registro = {
    id: gerarId(dados.sigla || dados.nome, (id) => Boolean(buscarSecretaria(id))),
    sigla: dados.sigla,
    nome: dados.nome,
    slug: dados.slug,
    ativo: dados.ativo !== false,
    teste: Boolean(dados.teste),
    criadoEm: agora,
    atualizadoEm: agora,
  }
  await repositorioCatalogo.criarSecretaria(registro, ator)
  const atual = await recarregar()
  const salvo = atual.secretarias.find((secretaria) => secretaria.id === registro.id)
  return resultadoAtualizado({}, salvo ?? registro)
}

export async function atualizarSecretaria(id, dados, ator) {
  const antes = buscarSecretaria(id)
  if (!antes) return { naoEncontrado: true }

  const campos = duplicidadeSecretaria({ ...antes, ...dados }, id)
  if (Object.keys(campos).length > 0) return { campos }

  const registro = {
    ...antes,
    ...dados,
    teste: dados.teste !== undefined ? dados.teste : antes.teste,
    atualizadoEm: new Date().toISOString(),
  }

  if (antes.ativo && registro.ativo === false) {
    const bloqueio = bloqueioDesativacaoSecretaria(registro)
    if (bloqueio) return { campos: bloqueio }
  }

  await repositorioCatalogo.atualizarSecretaria(registro, antes, ator)
  await recarregar()
  return resultadoAtualizado({}, buscarSecretaria(id) ?? registro)
}

export async function criarSetor(dados, ator) {
  const campos = {}
  validarSecretariaVinculada(dados.secretariaId, campos)
  if (Object.keys(campos).length > 0) return { campos }

  const agora = new Date().toISOString()
  const registro = {
    id: gerarId(dados.nome, (id) => Boolean(buscarSetor(id))),
    nome: dados.nome,
    descricao: dados.descricao ?? '',
    secretariaId: dados.secretariaId,
    central: false,
    ativo: dados.ativo !== false,
    criadoEm: agora,
    atualizadoEm: agora,
  }
  await repositorioCatalogo.criarSetor(registro, ator)
  const atual = await recarregar()
  const salvo = atual.setores.find((setor) => setor.id === registro.id)
  return resultadoAtualizado({}, salvo ?? registro)
}

export async function atualizarSetor(id, dados, ator) {
  const antes = buscarSetor(id)
  if (!antes) return { naoEncontrado: true }

  const registro = {
    ...antes,
    ...dados,
    central: antes.central,
    atualizadoEm: new Date().toISOString(),
  }

  const campos = {}
  if (dados.secretariaId !== undefined) {
    validarSecretariaVinculada(
      registro.secretariaId,
      campos,
      'Escolha uma secretaria ativa para o setor.',
    )
  } else if (registro.ativo && registro.secretariaId) {
    // O setor já pode estar vinculado a uma secretaria desativada; reativá-lo
    // sem revisar o vínculo deixaria o catálogo inconsistente.
    validarSecretariaVinculada(registro.secretariaId, campos)
  }
  if (Object.keys(campos).length > 0) return { campos }

  if (antes.ativo && registro.ativo === false) {
    const bloqueio = bloqueioDesativacaoSetor(registro)
    if (bloqueio) return { campos: bloqueio }
  }

  await repositorioCatalogo.atualizarSetor(registro, antes, ator)
  await recarregar()
  return resultadoAtualizado({}, buscarSetor(id) ?? registro)
}

export async function criarServico(dados, ator) {
  const campos = {}
  validarSetorVinculado(dados.setorId, campos)
  if (Object.keys(campos).length > 0) return { campos }

  const agora = new Date().toISOString()
  const registro = {
    id: gerarId(dados.titulo, (id) => Boolean(buscarServico(id, { incluirInativos: true }))),
    titulo: dados.titulo,
    descricao: dados.descricao ?? '',
    categoria: dados.categoria ?? '',
    prazoDias: dados.prazoDias ?? 10,
    ordem: dados.ordem ?? 0,
    destaque: Boolean(dados.destaque),
    novo: Boolean(dados.novo),
    setorId: dados.setorId,
    ativo: dados.ativo !== false,
    criadoEm: agora,
    atualizadoEm: agora,
  }
  await repositorioCatalogo.criarServico(registro, ator)
  const atual = await recarregar()
  const salvo = atual.servicos.find((servico) => servico.id === registro.id)
  return resultadoAtualizado({}, salvo ?? registro)
}

export async function atualizarServico(id, dados, ator) {
  const antes = buscarServico(id, { incluirInativos: true })
  if (!antes) return { naoEncontrado: true }

  const registro = {
    ...antes,
    ...dados,
    atualizadoEm: new Date().toISOString(),
  }

  const campos = {}
  if (dados.setorId !== undefined) {
    validarSetorVinculado(registro.setorId, campos)
  } else if (registro.ativo && registro.setorId) {
    validarSetorVinculado(registro.setorId, campos)
  }
  if (Object.keys(campos).length > 0) return { campos }

  if (antes.ativo && registro.ativo === false) {
    const bloqueio = bloqueioDesativacaoServico(registro)
    if (bloqueio) return { campos: bloqueio }
  }

  await repositorioCatalogo.atualizarServico(registro, antes, ator)
  await recarregar()
  return resultadoAtualizado(
    {},
    buscarServico(id, { incluirInativos: true }) ?? registro,
  )
}
