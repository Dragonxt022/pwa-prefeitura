/**
 * Estado mutável do piloto.
 *
 * Com MySQL configurado, os dados são lidos uma vez na inicialização e cada
 * alteração é gravada no banco pela camada de repositório. Sem banco, o piloto
 * continua usando o arquivo JSON local com gravação atômica (arquivo
 * temporário + fsync + renomeação) e backup `.bak`.
 *
 * Falhas de leitura não caem silenciosamente nas sementes: o backup é tentado
 * e, se também estiver inválido, o processo falha para evitar perda ou
 * exposição silenciosa de dados.
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
import { normalizarCidadao } from '../dominio/cidadaos.js'
import { criarConfiguracoesPadrao, normalizarConfiguracoes } from '../dominio/configuracoes.js'
import {
  calcularSequencia,
  criarUsuariosSemente,
  normalizarSolicitacao,
  normalizarUsuario,
} from '../dominio/normalizacao.js'
import { CODIGO_ACESSO_SEMENTE, SOLICITACOES_SEMENTE } from '../dominio/sementes.js'
import { hashToken } from '../utils/seguranca.js'
import { mysqlConfigurado } from './mysql.js'
import {
  atualizarSolicitacao as atualizarSolicitacaoMysql,
  atualizarUsuario as atualizarUsuarioMysql,
  carregarTudo,
  importarEstadoInicial,
  inicializarTabelas,
  removerUsuario as removerUsuarioMysql,
} from './mysql-dados.js'

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
  cidadaos: [],
  sessoesCidadao: [],
  recuperacoesSenha: [],
  configuracoes: criarConfiguracoesPadrao(),
  sequencia: 3,
}

/** Fonte efetiva dos dados, exposta no painel e nos logs. */
export function persistenciaDados() {
  return mysqlConfigurado ? 'mysql' : 'json'
}

function serializar() {
  return JSON.stringify({
    versao: VERSAO_DADOS,
    salvoEm: new Date().toISOString(),
    sequencia: estado.sequencia,
    solicitacoes: estado.solicitacoes,
    usuarios: estado.usuarios,
    sessoes: estado.sessoes,
    cidadaos: estado.cidadaos,
    sessoesCidadao: estado.sessoesCidadao,
    recuperacoesSenha: estado.recuperacoesSenha,
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
  if (salvo.cidadaos !== undefined && !Array.isArray(salvo.cidadaos)) {
    throw new Error('o campo "cidadaos" deve ser uma lista')
  }
  if (salvo.sessoesCidadao !== undefined && !Array.isArray(salvo.sessoesCidadao)) {
    throw new Error('o campo "sessoesCidadao" deve ser uma lista')
  }
  if (salvo.recuperacoesSenha !== undefined && !Array.isArray(salvo.recuperacoesSenha)) {
    throw new Error('o campo "recuperacoesSenha" deve ser uma lista')
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

/** Gravação no arquivo JSON. Usada apenas quando não há MySQL configurado. */
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

/**
 * Migração única da extinta Ouvidoria.
 *
 * O setor e o serviço foram removidos do catálogo. Usuários de demonstração
 * vinculados à Ouvidoria são descartados; qualquer outro vínculo e as
 * solicitações antigas voltam para a triagem central, com registro no
 * histórico. A remoção do setor não pode deixar pedidos inacessíveis.
 */
function migrarOuvidoria() {
  const usuariosRemovidos = []
  const usuariosAlterados = []
  const solicitacoesAlteradas = []

  const usuariosMantidos = estado.usuarios.filter((usuario) => {
    const remover =
      usuario.id === 'usuario-ouvidoria' ||
      usuario.email === 'ouvidoria@prefeitura.demo'
    if (remover) usuariosRemovidos.push(usuario.id)
    return !remover
  })
  if (usuariosMantidos.length !== estado.usuarios.length) {
    estado.usuarios.splice(0, estado.usuarios.length, ...usuariosMantidos)
  }

  for (const usuario of estado.usuarios) {
    if (usuario.setorId !== 'ouvidoria') continue
    usuario.setorId = 'triagem'
    usuariosAlterados.push(usuario)
  }

  for (const solicitacao of estado.solicitacoes) {
    if (solicitacao.setorId !== 'ouvidoria') continue
    const agora = new Date().toISOString()
    solicitacao.setorId = 'triagem'
    solicitacao.atualizadoEm = agora
    solicitacao.historico.push({
      status: solicitacao.status,
      em: agora,
      tipo: 'migracao',
      observacao: 'Setor de Ouvidoria removido; solicitação devolvida à triagem.',
    })
    solicitacoesAlteradas.push(solicitacao)
  }

  const alterou = usuariosRemovidos.length > 0 ||
    usuariosAlterados.length > 0 ||
    solicitacoesAlteradas.length > 0
  if (alterou) {
    console.log('[dados] Ouvidoria removida; vínculos e solicitações antigas migrados para a triagem.')
  }
  return { alterou, usuariosRemovidos, usuariosAlterados, solicitacoesAlteradas }
}

/** Monta os dados a partir do JSON salvo (ou das sementes, se não houver). */
function montarDados(salvo) {
  let solicitacoesCarregadas = SOLICITACOES_SEMENTE
  let sequenciaSalva = 0
  let usuariosCarregados = null
  let sessoesCarregadas = []
  let cidadaosCarregados = []
  let sessoesCidadaoCarregadas = []
  let recuperacoesCarregadas = []
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
    if (salvo.cidadaos !== undefined) {
      if (!Array.isArray(salvo.cidadaos)) {
        throw new Error('[dados] o campo "cidadaos" deve ser uma lista.')
      }
      cidadaosCarregados = salvo.cidadaos
    }
    if (salvo.sessoesCidadao !== undefined) {
      if (!Array.isArray(salvo.sessoesCidadao)) {
        throw new Error('[dados] o campo "sessoesCidadao" deve ser uma lista.')
      }
      sessoesCidadaoCarregadas = salvo.sessoesCidadao
    }
    if (salvo.recuperacoesSenha !== undefined) {
      if (!Array.isArray(salvo.recuperacoesSenha)) {
        throw new Error('[dados] o campo "recuperacoesSenha" deve ser uma lista.')
      }
      recuperacoesCarregadas = salvo.recuperacoesSenha
    }
    if (salvo.configuracoes !== undefined) {
      if (!salvo.configuracoes || typeof salvo.configuracoes !== 'object' ||
        Array.isArray(salvo.configuracoes)) {
        throw new Error('[dados] o campo "configuracoes" deve ser um objeto.')
      }
      configuracoesCarregadas = salvo.configuracoes
    }
  }

  const solicitacoes = solicitacoesCarregadas.map(normalizarSolicitacaoCarregada)
  const usuarios = (usuariosCarregados
    ? usuariosCarregados.map(normalizarUsuario)
    : criarUsuariosSemente())
  const cidadaos = cidadaosCarregados.map(normalizarCidadao)
  const agora = Date.now()
  const sessoes = sessoesCarregadas.filter((sessao) => {
    if (!sessao || typeof sessao !== 'object') return false
    const expira = new Date(sessao.expiraEm).getTime()
    return Number.isFinite(expira) && expira > agora && usuarios.some(
      (usuario) => usuario.id === sessao.usuarioId && usuario.ativo,
    )
  })
  const sessoesCidadao = sessoesCidadaoCarregadas.filter((sessao) => {
    if (!sessao || typeof sessao !== 'object') return false
    const expira = new Date(sessao.expiraEm).getTime()
    return Number.isFinite(expira) && expira > agora && cidadaos.some(
      (cidadao) => cidadao.id === sessao.cidadaoId && cidadao.ativo,
    )
  })

  const recuperacoesSenha = recuperacoesCarregadas.filter((registro) => {
    if (!registro || typeof registro !== 'object' || registro.usadoEm) return false
    return new Date(registro.expiraEm).getTime() > agora
  })

  return {
    solicitacoes,
    usuarios,
    sessoes,
    cidadaos,
    sessoesCidadao,
    recuperacoesSenha,
    configuracoes: normalizarConfiguracoes(configuracoesCarregadas ?? {}),
    sequencia: Math.max(sequenciaSalva, calcularSequencia(solicitacoes)),
  }
}

/** Aplica um conjunto de dados ao estado em memória. */
function aplicarDados(dados) {
  estado.solicitacoes.length = 0
  estado.solicitacoes.push(...dados.solicitacoes.map((item) => structuredClone(item)))

  estado.usuarios.length = 0
  estado.usuarios.push(...dados.usuarios.map((item) => structuredClone(item)))

  estado.sessoes.length = 0
  estado.sessoes.push(...dados.sessoes.map((item) => structuredClone(item)))

  estado.cidadaos.length = 0
  estado.cidadaos.push(...(dados.cidadaos ?? []).map((item) => structuredClone(item)))

  estado.sessoesCidadao.length = 0
  estado.sessoesCidadao.push(
    ...(dados.sessoesCidadao ?? []).map((item) => structuredClone(item)),
  )

  estado.recuperacoesSenha.length = 0
  estado.recuperacoesSenha.push(
    ...(dados.recuperacoesSenha ?? []).map((item) => structuredClone(item)),
  )

  Object.assign(
    estado.configuracoes,
    structuredClone(dados.configuracoes ?? criarConfiguracoesPadrao()),
  )
  estado.sequencia = Math.max(
    Number(dados.sequencia) || 0,
    calcularSequencia(dados.solicitacoes),
  )
}

/** Carrega o JSON local (modo sem MySQL). */
function carregarJson() {
  const salvo = lerEstadoSalvo()
  aplicarDados(montarDados(salvo))
  if (migrarOuvidoria().alterou) persistir()
}

/**
 * Inicializa os dados no MySQL.
 *
 * Na primeira execução com banco vazio, importa o arquivo JSON existente
 * (preservando solicitações, usuários, sessões, configurações e sequência) ou,
 * se não houver arquivo, as sementes do piloto. Nas demais, apenas carrega o
 * banco.
 */
export async function inicializarDados() {
  if (!mysqlConfigurado) {
    carregarJson()
    return { persistencia: 'json' }
  }

  await inicializarTabelas()
  const dados = await carregarTudo()

  if (dados.vazio) {
    const salvo = lerEstadoSalvo()
    aplicarDados(montarDados(salvo))
    const ouvidoriaMigrada = migrarOuvidoria().alterou
    const paraImportar = {
      solicitacoes: estado.solicitacoes,
      usuarios: estado.usuarios,
      sessoes: estado.sessoes,
      cidadaos: estado.cidadaos,
      sessoesCidadao: estado.sessoesCidadao,
      recuperacoesSenha: estado.recuperacoesSenha,
      configuracoes: estado.configuracoes,
      sequencia: estado.sequencia,
    }
    await importarEstadoInicial(paraImportar)
    console.log(
      `[dados] MySQL inicializado a partir de ${salvo ? 'backend/data/estado.json' : 'sementes'}` +
      `${ouvidoriaMigrada ? ' (Ouvidoria migrada)' : ''}.`,
    )
    return { persistencia: 'mysql', importado: true }
  }

  aplicarDados(dados)
  const migracao = migrarOuvidoria()
  if (migracao.alterou) {
    await persistirMigracaoOuvidoria(migracao)
  }
  return { persistencia: 'mysql', importado: false }
}

/** Regrava no MySQL apenas os registros alterados pela migração da Ouvidoria. */
async function persistirMigracaoOuvidoria({ usuariosRemovidos, usuariosAlterados, solicitacoesAlteradas }) {
  for (const id of usuariosRemovidos) {
    await removerUsuarioMysql(id)
  }
  for (const usuario of usuariosAlterados) {
    await atualizarUsuarioMysql(usuario)
  }
  for (const solicitacao of solicitacoesAlteradas) {
    await atualizarSolicitacaoMysql(solicitacao)
  }
}

// Sem MySQL, o estado precisa estar disponível de forma síncrona assim que o
// módulo é importado (testes, scripts e desenvolvimento local).
if (!mysqlConfigurado) {
  carregarJson()
}
