/**
 * Estado mutável do piloto e persistência em JSON.
 *
 * A gravação usa arquivo temporário + fsync + renomeação atômica, mantendo um
 * `.bak` da última versão válida. Falhas de leitura não caem silenciosamente
 * nas sementes: o backup é tentado e, se também estiver inválido, o processo
 * falha para evitar perda ou exposição silenciosa de dados.
 */
import {
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { criarConfiguracoesPadrao, normalizarConfiguracoes } from '../dominio/configuracoes.js'
import {
  calcularSequencia,
  criarUsuariosSemente,
  normalizarSolicitacao,
  normalizarUsuario,
} from '../dominio/normalizacao.js'
import { CODIGO_ACESSO_SEMENTE, SOLICITACOES_SEMENTE } from '../dominio/sementes.js'
import { hashToken } from '../utils/seguranca.js'

const raizBackend = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const arquivoDados = process.env.DATA_FILE
  ? resolve(process.env.DATA_FILE)
  : resolve(raizBackend, 'data', 'estado.json')
const arquivoTemporario = `${arquivoDados}.tmp`
const arquivoBackup = `${arquivoDados}.bak`
const VERSAO_DADOS = 4
const HASH_ACESSO_SEMENTE = hashToken(CODIGO_ACESSO_SEMENTE)
const PROTOCOLOS_SEMENTE = new Set(SOLICITACOES_SEMENTE.map((item) => item.protocolo))

export const estado = {
  solicitacoes: [],
  usuarios: [],
  sessoes: [],
  configuracoes: criarConfiguracoesPadrao(),
  sequencia: 3,
}

function serializar() {
  return JSON.stringify({
    versao: VERSAO_DADOS,
    salvoEm: new Date().toISOString(),
    sequencia: estado.sequencia,
    solicitacoes: estado.solicitacoes,
    usuarios: estado.usuarios,
    sessoes: estado.sessoes,
    configuracoes: estado.configuracoes,
  }, null, 2)
}

function escreverArquivoTemporario(conteudo) {
  const descritor = openSync(arquivoTemporario, 'w')
  try {
    writeSync(descritor, conteudo, null, 'utf8')
    fsyncSync(descritor)
  } finally {
    closeSync(descritor)
  }
}

function validarEstado(salvo) {
  if (!salvo || typeof salvo !== 'object' || Array.isArray(salvo)) {
    throw new Error('o conteúdo não é um objeto JSON de estado')
  }
  if (!Array.isArray(salvo.solicitacoes)) {
    throw new Error('o campo "solicitacoes" deve ser uma lista')
  }
  if (!salvo.solicitacoes.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
    throw new Error('há uma solicitação inválida no arquivo de estado')
  }
  if (salvo.usuarios !== undefined && !Array.isArray(salvo.usuarios)) {
    throw new Error('o campo "usuarios" deve ser uma lista')
  }
  if (salvo.usuarios?.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new Error('há um usuário inválido no arquivo de estado')
  }
  if (salvo.sessoes !== undefined && !Array.isArray(salvo.sessoes)) {
    throw new Error('o campo "sessoes" deve ser uma lista')
  }
  if (
    salvo.configuracoes !== undefined &&
    (!salvo.configuracoes || typeof salvo.configuracoes !== 'object' ||
      Array.isArray(salvo.configuracoes))
  ) {
    throw new Error('o campo "configuracoes" deve ser um objeto')
  }
  return salvo
}

function arquivoEstadoValido(caminho) {
  try {
    lerJson(caminho)
    return true
  } catch {
    return false
  }
}

export function persistir() {
  try {
    mkdirSync(dirname(arquivoDados), { recursive: true })
    escreverArquivoTemporario(serializar())

    // Só substitui o backup se o arquivo atual ainda for um estado válido; assim
    // uma corrupção ou schema incompleto não apaga a última cópia boa.
    if (existsSync(arquivoDados) && arquivoEstadoValido(arquivoDados)) {
      copyFileSync(arquivoDados, arquivoBackup)
    }

    renameSync(arquivoTemporario, arquivoDados)
  } catch (erro) {
    try {
      if (existsSync(arquivoTemporario)) unlinkSync(arquivoTemporario)
    } catch {
      // Preserva o erro original da gravação.
    }
    console.error(`[dados] não foi possível salvar ${arquivoDados}:`, erro.message)
    throw erro
  }
}

function lerJson(caminho) {
  const conteudo = readFileSync(caminho, 'utf8')
  return validarEstado(JSON.parse(conteudo))
}

function lerEstadoSalvo() {
  if (existsSync(arquivoDados)) {
    try {
      return lerJson(arquivoDados)
    } catch (erroPrincipal) {
      if (!existsSync(arquivoBackup)) {
        throw new Error(
          `[dados] ${arquivoDados} está inválido (${erroPrincipal.message}) e não há backup. ` +
          'Corrija o arquivo ou restaure uma cópia antes de iniciar.',
        )
      }
      try {
        const salvo = lerJson(arquivoBackup)
        console.warn(
          `[dados] ${arquivoDados} inválido; estado recuperado de ${arquivoBackup}.`,
        )
        return salvo
      } catch (erroBackup) {
        throw new Error(
          `[dados] ${arquivoDados} e ${arquivoBackup} estão inválidos ` +
          `(${erroPrincipal.message}; ${erroBackup.message}).`,
        )
      }
    }
  }

  if (existsSync(arquivoBackup)) {
    try {
      const salvo = lerJson(arquivoBackup)
      console.warn(`[dados] ${arquivoDados} ausente; estado recuperado de ${arquivoBackup}.`)
      return salvo
    } catch (erroBackup) {
      throw new Error(`[dados] ${arquivoBackup} está inválido: ${erroBackup.message}`)
    }
  }

  return null
}

function normalizarSolicitacaoCarregada(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error('[dados] solicitação inválida no arquivo de estado.')
  }
  const normalizada = normalizarSolicitacao(item)
  if (!normalizada.codigoAcessoHash && PROTOCOLOS_SEMENTE.has(normalizada.protocolo)) {
    return { ...normalizada, codigoAcessoHash: HASH_ACESSO_SEMENTE }
  }
  return normalizada
}

function carregar() {
  const salvo = lerEstadoSalvo()

  let solicitacoesCarregadas = SOLICITACOES_SEMENTE
  let sequenciaSalva = 0
  let usuariosCarregados = null
  let sessoesCarregadas = []
  let configuracoesCarregadas = null

  if (salvo) {
    if (!Array.isArray(salvo.solicitacoes)) {
      throw new Error('[dados] o campo "solicitacoes" deve ser uma lista.')
    }
    solicitacoesCarregadas = salvo.solicitacoes
    sequenciaSalva = Number(salvo.sequencia) || 0

    if (salvo.usuarios !== undefined) {
      if (!Array.isArray(salvo.usuarios)) {
        throw new Error('[dados] o campo "usuarios" deve ser uma lista.')
      }
      if (salvo.usuarios.length > 0) usuariosCarregados = salvo.usuarios
    }
    if (salvo.sessoes !== undefined) {
      if (!Array.isArray(salvo.sessoes)) {
        throw new Error('[dados] o campo "sessoes" deve ser uma lista.')
      }
      sessoesCarregadas = salvo.sessoes
    }
    if (salvo.configuracoes !== undefined) {
      if (!salvo.configuracoes || typeof salvo.configuracoes !== 'object' ||
        Array.isArray(salvo.configuracoes)) {
        throw new Error('[dados] o campo "configuracoes" deve ser um objeto.')
      }
      configuracoesCarregadas = salvo.configuracoes
    }
  }

  estado.solicitacoes.length = 0
  estado.solicitacoes.push(...solicitacoesCarregadas.map(normalizarSolicitacaoCarregada))
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
      if (!sessao || typeof sessao !== 'object') return false
      const expira = new Date(sessao.expiraEm).getTime()
      return Number.isFinite(expira) && expira > agora && estado.usuarios.some(
        (usuario) => usuario.id === sessao.usuarioId && usuario.ativo,
      )
    }),
  )
}

carregar()
