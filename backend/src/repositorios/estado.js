/**
 * Estado mutável do piloto e persistência simple em JSON.
 *
 * A escrita síncrona atende ao piloto. Usuários e sessões são persistidos
 * apenas com hash; configurações sensíveis continuam sob responsabilidade do
 * módulo de configurações.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { criarConfiguracoesPadrao, normalizarConfiguracoes } from '../dominio/configuracoes.js'
import {
  calcularSequencia,
  criarUsuariosSemente,
  normalizarSolicitacao,
  normalizarUsuario,
} from '../dominio/normalizacao.js'
import { SOLICITACOES_SEMENTE } from '../dominio/sementes.js'

const raizBackend = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const arquivoDados = process.env.DATA_FILE
  ? resolve(process.env.DATA_FILE)
  : resolve(raizBackend, 'data', 'estado.json')

export const estado = {
  solicitacoes: [],
  usuarios: [],
  sessoes: [],
  configuracoes: criarConfiguracoesPadrao(),
  sequencia: 3,
}

export function persistir() {
  try {
    mkdirSync(dirname(arquivoDados), { recursive: true })
    writeFileSync(
      arquivoDados,
      JSON.stringify({
        versao: 3,
        salvoEm: new Date().toISOString(),
        sequencia: estado.sequencia,
        solicitacoes: estado.solicitacoes,
        usuarios: estado.usuarios,
        sessoes: estado.sessoes,
        configuracoes: estado.configuracoes,
      }, null, 2),
    )
  } catch (erro) {
    console.error(`[dados] não foi possível salvar ${arquivoDados}:`, erro.message)
  }
}

function carregar() {
  let solicitacoesCarregadas = SOLICITACOES_SEMENTE
  let sequenciaSalva = 0
  let usuariosCarregados = null
  let sessoesCarregadas = []
  let configuracoesCarregadas = null

  if (existsSync(arquivoDados)) {
    try {
      const salvo = JSON.parse(readFileSync(arquivoDados, 'utf8'))
      if (Array.isArray(salvo.solicitacoes)) {
        solicitacoesCarregadas = salvo.solicitacoes
        sequenciaSalva = Number(salvo.sequencia) || 0
      }
      if (Array.isArray(salvo.usuarios) && salvo.usuarios.length > 0) {
        usuariosCarregados = salvo.usuarios
      }
      if (Array.isArray(salvo.sessoes)) sessoesCarregadas = salvo.sessoes
      if (salvo.configuracoes && typeof salvo.configuracoes === 'object') {
        configuracoesCarregadas = salvo.configuracoes
      }
    } catch (erro) {
      console.warn(`[dados] não foi possível ler ${arquivoDados}:`, erro.message)
    }
  }

  estado.solicitacoes.length = 0
  estado.solicitacoes.push(...solicitacoesCarregadas.map(normalizarSolicitacao))
  estado.sequencia = Math.max(sequenciaSalva, calcularSequencia(estado.solicitacoes))

  estado.usuarios.length = 0
  estado.usuarios.push(...(usuariosCarregados
    ? usuariosCarregados.map(normalizarUsuario)
    : criarUsuariosSemente()))

  Object.assign(estado.configuracoes, normalizarConfiguracoes(configuracoesCarregadas ?? {}))

  const agora = Date.now()
  estado.sessoes.length = 0
  estado.sessoes.push(
    ...sessoesCarregadas.filter((sessao) => {
      const expira = new Date(sessao.expiraEm).getTime()
      return Number.isFinite(expira) && expira > agora && estado.usuarios.some(
        (usuario) => usuario.id === sessao.usuarioId && usuario.ativo,
      )
    }),
  )
}

carregar()
