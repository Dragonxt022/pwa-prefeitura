/**
 * Regras de negócio dos avisos da cidade.
 *
 * O cache do domínio é recarregado após cada gravação para que a Home e o
 * painel leiam sempre o estado persistido.
 */
import {
  aplicarAvisos,
  buscarAviso,
  listarAvisos,
} from '../dominio/avisos.js'
import * as repositorioAvisos from '../repositorios/avisos.js'
import { mysqlConfigurado } from '../repositorios/mysql.js'
import { normalizarTexto } from '../utils/texto.js'

const LIMITE_AUDITORIA = 15

export function persistenciaAtual() {
  return mysqlConfigurado ? 'mysql' : 'memoria'
}

export async function inicializarAvisos() {
  const lista = await repositorioAvisos.inicializar()
  aplicarAvisos(lista)
  return { avisos: lista, persistencia: persistenciaAtual() }
}

async function recarregar() {
  const lista = await repositorioAvisos.carregar()
  aplicarAvisos(lista)
  return lista
}

export function obterAvisos() {
  return {
    avisos: listarAvisos({ incluirInativos: true }),
    persistencia: persistenciaAtual(),
  }
}

export function listarAuditoriaAvisos() {
  return repositorioAvisos.listarAuditoria(LIMITE_AUDITORIA)
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
  const base = baseId(valor) || 'aviso'
  if (!existe(base)) return base
  for (let numero = 2; numero <= 999; numero += 1) {
    const candidato = `${base}_${numero}`.slice(0, 48)
    if (!existe(candidato)) return candidato
  }
  throw new Error('Não foi possível gerar um identificador único para o aviso.')
}

function duplicidadeTitulo(dados, idAtual = null) {
  const campos = {}
  const titulo = normalizarTexto(dados.titulo)
  if (!titulo) return campos
  const repetido = listarAvisos({ incluirInativos: true }).some(
    (aviso) => aviso.id !== idAtual && normalizarTexto(aviso.titulo) === titulo,
  )
  if (repetido) campos.titulo = 'Já existe um aviso com este título.'
  return campos
}

export async function criarAviso(dados, ator) {
  const campos = duplicidadeTitulo(dados)
  if (Object.keys(campos).length > 0) return { campos }

  const agora = new Date().toISOString()
  const registro = {
    id: gerarId(dados.titulo, (id) => Boolean(buscarAviso(id))),
    titulo: dados.titulo,
    resumo: dados.resumo,
    categoria: dados.categoria,
    prioridade: dados.prioridade ?? 'normal',
    publicadoEm: dados.publicadoEm ?? agora,
    ativo: dados.ativo !== false,
    criadoEm: agora,
    atualizadoEm: agora,
  }

  await repositorioAvisos.criar(registro, ator)
  await recarregar()
  return { registro: buscarAviso(registro.id) ?? registro }
}

export async function atualizarAviso(id, dados, ator) {
  const antes = buscarAviso(id)
  if (!antes) return { naoEncontrado: true }

  const campos = duplicidadeTitulo({ ...antes, ...dados }, id)
  if (Object.keys(campos).length > 0) return { campos }

  const registro = {
    ...antes,
    ...dados,
    atualizadoEm: new Date().toISOString(),
  }

  await repositorioAvisos.atualizar(registro, antes, ator)
  await recarregar()
  return { registro: buscarAviso(id) ?? registro }
}
