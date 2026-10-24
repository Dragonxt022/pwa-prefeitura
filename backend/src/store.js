/**
 * Store do piloto com persistencia simples em JSON.
 *
 * O arquivo de dados fica fora do Git (backend/data/estado.json) e pode ser
 * trocado com a variavel DATA_FILE. A escrita e suficiente para o piloto,
 * mas nao substitui um banco de dados transacional.
 *
 * A partir da v4 o mesmo arquivo guarda tambem usuarios, setores (mapa
 * demonstrativo) e sessoes. Senhas e tokens de sessao sao persistidos apenas
 * como hash; nunca em texto puro.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gerarHashSenha, gerarTokenSessao, hashToken, verificarSenha } from './auth.js'
import {
  configuracoesAdmin,
  configuracoesPublicas,
  criarConfiguracoesPadrao,
  normalizarConfiguracoes,
} from './configuracoes.js'
import { classificarSolicitacao, MODELO_TRIAGEM } from './triagem.js'

const raizBackend = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arquivoDados = process.env.DATA_FILE
  ? resolve(process.env.DATA_FILE)
  : resolve(raizBackend, 'data', 'estado.json')

const DIAS_SESSAO_LEMBRAR = Math.max(1, Number(process.env.SESSION_DAYS) || 30)
const HORAS_SESSAO_PADRAO = 12

export const STATUS = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  indeferida: 'Indeferida',
}

export const STATUS_ABERTOS = ['recebida', 'em_analise', 'em_execucao']
export const STATUS_FINAIS = ['concluida', 'indeferida']

export const PAPEIS = {
  admin: 'Administrador geral',
  triagem: 'Triagem / Protocolo',
  setor: 'Setor',
}

/**
 * Mapa demonstrativo. A lista oficial de secretarias ainda não foi informada;
 * ajuste os nomes/serviços aqui (ou evolua para uma tabela no banco) quando o
 * município confirmar a estrutura. A triagem central nunca deixa de ver tudo.
 */
export const setores = [
  {
    id: 'triagem',
    nome: 'Triagem e Protocolo',
    secretaria: 'Comunicação e Atendimento',
    descricao: 'Recebe, classifica e encaminha as solicitações para os setores.',
    servicos: [],
    central: true,
    ativo: true,
  },
  {
    id: 'infraestrutura',
    nome: 'Obras e Infraestrutura',
    secretaria: 'Secretaria de Obras',
    descricao: 'Iluminação pública e pavimentação.',
    servicos: ['iluminacao', 'pavimentacao'],
    central: false,
    ativo: true,
  },
  {
    id: 'zeladoria',
    nome: 'Zeladoria e Serviços Urbanos',
    secretaria: 'Secretaria de Serviços Urbanos',
    descricao: 'Limpeza, coleta e conservação da cidade.',
    servicos: ['limpeza', 'zeladoria'],
    central: false,
    ativo: true,
  },
  {
    id: 'meio_ambiente',
    nome: 'Meio Ambiente',
    secretaria: 'Secretaria de Meio Ambiente',
    descricao: 'Poda, arborização e proteção ambiental.',
    servicos: ['poda', 'meio_ambiente'],
    central: false,
    ativo: true,
  },
  {
    id: 'fiscalizacao',
    nome: 'Fiscalização e Posturas',
    secretaria: 'Secretaria de Fiscalização',
    descricao: 'Terrenos, construções e posturas municipais.',
    servicos: ['fiscalizacao'],
    central: false,
    ativo: true,
  },
  {
    id: 'mobilidade',
    nome: 'Mobilidade e Trânsito',
    secretaria: 'Secretaria de Mobilidade',
    descricao: 'Sinalização, trânsito e acessibilidade viária.',
    servicos: ['sinalizacao'],
    central: false,
    ativo: true,
  },
  {
    id: 'ouvidoria',
    nome: 'Ouvidoria',
    secretaria: 'Controladoria / Ouvidoria',
    descricao: 'Elogios, reclamações, sugestões e denúncias.',
    servicos: ['ouvidoria'],
    central: false,
    ativo: true,
  },
]

export const servicos = [
  {
    id: 'iluminacao',
    titulo: 'Iluminação pública',
    descricao: 'Poste apagado, lâmpada queimada, luminária danificada ou fiação exposta.',
    categoria: 'Infraestrutura',
    prazoDias: 5,
    ordem: 1,
    destaque: true,
  },
  {
    id: 'pavimentacao',
    titulo: 'Buracos e pavimentação',
    descricao: 'Buraco na via, afundamento de asfalto, calçada quebrada ou meio-fio danificado.',
    categoria: 'Infraestrutura',
    prazoDias: 15,
    ordem: 2,
    destaque: true,
  },
  {
    id: 'limpeza',
    titulo: 'Coleta de lixo e limpeza',
    descricao: 'Lixo acumulado, entulho em via pública, poda de mato ou limpeza de bueiro.',
    categoria: 'Zeladoria',
    prazoDias: 3,
    ordem: 3,
    destaque: true,
  },
  {
    id: 'poda',
    titulo: 'Poda de árvores',
    descricao: 'Galhos sobre a rede elétrica, árvore com risco de queda ou poda de rotina.',
    categoria: 'Meio ambiente',
    prazoDias: 10,
    ordem: 4,
    destaque: true,
  },
  {
    id: 'fiscalizacao',
    titulo: 'Fiscalização de terrenos',
    descricao: 'Terreno abandonado, mato alto, descarte irregular ou construção irregular.',
    categoria: 'Fiscalização',
    prazoDias: 20,
    ordem: 5,
    destaque: true,
  },
  {
    id: 'sinalizacao',
    titulo: 'Sinalização de trânsito',
    descricao: 'Placa danificada, faixa apagada, semáforo com defeito ou falta de sinalização.',
    categoria: 'Mobilidade',
    prazoDias: 7,
    ordem: 6,
    destaque: true,
  },
  {
    id: 'ouvidoria',
    titulo: 'Ouvidoria',
    descricao: 'Elogio, reclamação, sugestão ou denúncia sobre o atendimento público.',
    categoria: 'Atendimento',
    prazoDias: 10,
    ordem: 7,
    destaque: false,
    novo: true,
  },
  {
    id: 'zeladoria',
    titulo: 'Zeladoria urbana',
    descricao: 'Bueiro entupido, calçada danificada, praça, mobiliário ou esgoto a céu aberto.',
    categoria: 'Zeladoria',
    prazoDias: 7,
    ordem: 8,
    destaque: false,
    novo: true,
  },
  {
    id: 'meio_ambiente',
    titulo: 'Meio ambiente',
    descricao: 'Descarte irregular, queimada, poluição, maus-tratos a animais ou risco ambiental.',
    categoria: 'Meio ambiente',
    prazoDias: 10,
    ordem: 9,
    destaque: false,
    novo: true,
  },
]

export const avisos = [
  {
    id: 'aviso-1',
    titulo: 'Vacinação antirrábica neste sábado',
    resumo: 'Postos móveis em três bairros, das 8h às 16h. Leve o cartão de vacinação do animal.',
    publicadoEm: '2026-10-20T13:00:00-03:00',
    prioridade: 'alta',
    categoria: 'Saúde',
  },
  {
    id: 'aviso-2',
    titulo: 'Manutenção programada no portal',
    resumo: 'O acompanhamento de protocolos fica indisponível das 22h às 23h30 desta quinta-feira.',
    publicadoEm: '2026-10-19T09:30:00-03:00',
    prioridade: 'normal',
    categoria: 'Serviço',
  },
  {
    id: 'aviso-3',
    titulo: 'Nova unidade de saúde no Jardim das Acácias',
    resumo: 'Atendimento começa na segunda-feira, das 7h às 19h, com clínico geral e pediatria.',
    publicadoEm: '2026-10-16T16:45:00-03:00',
    prioridade: 'normal',
    categoria: 'Saúde',
  },
  {
    id: 'aviso-4',
    titulo: 'Coleta seletiva ampliada',
    resumo: 'Mais quatro bairros passam a ter coleta seletiva semanal a partir de novembro.',
    publicadoEm: '2026-10-14T11:15:00-03:00',
    prioridade: 'baixa',
    categoria: 'Zeladoria',
  },
]

export const perfil = {
  id: 'cidadao-demo',
  nome: 'Cidadão Demo',
  documentoMascarado: '***.***.***-**',
  email: 'cidadao.demo@exemplo.gov.br',
  telefone: '(00) 00000-0000',
  bairro: 'Centro',
  desde: '2026-03-11',
  preferencias: {
    notificacoes: false,
    canalPreferido: 'email',
  },
}

const SOLICITACOES_SEMENTE = [
  {
    protocolo: 'PREF-2026-000001',
    tipo: 'iluminacao',
    tipoTitulo: 'Iluminação pública',
    descricao: 'Poste da Rua das Palmeiras em frente ao número 120 está apagado há três noites.',
    endereco: 'Rua das Palmeiras, 120 - Centro',
    contato: null,
    status: 'em_analise',
    criadoEm: '2026-10-12T19:04:00-03:00',
    atualizadoEm: '2026-10-14T08:20:00-03:00',
    historico: [
      { status: 'recebida', em: '2026-10-12T19:04:00-03:00', observacao: 'Solicitação registrada pelo aplicativo.' },
      { status: 'em_analise', em: '2026-10-14T08:20:00-03:00', observacao: 'Encaminhada para a equipe de iluminação pública.' },
    ],
  },
  {
    protocolo: 'PREF-2026-000002',
    tipo: 'limpeza',
    tipoTitulo: 'Coleta de lixo e limpeza',
    descricao: 'Entulho descartado na calçada da Avenida Brasil, próximo ao ponto de ônibus.',
    endereco: 'Avenida Brasil, 900 - Jardim América',
    contato: null,
    status: 'concluida',
    criadoEm: '2026-09-28T10:12:00-03:00',
    atualizadoEm: '2026-10-02T15:40:00-03:00',
    historico: [
      { status: 'recebida', em: '2026-09-28T10:12:00-03:00', observacao: 'Solicitação registrada pelo aplicativo.' },
      { status: 'em_execucao', em: '2026-09-30T07:55:00-03:00', observacao: 'Equipe de zeladoria designada.' },
      { status: 'concluida', em: '2026-10-02T15:40:00-03:00', observacao: 'Entulho removido e calçada liberada.' },
    ],
  },
  {
    protocolo: 'PREF-2026-000003',
    tipo: 'pavimentacao',
    tipoTitulo: 'Buracos e pavimentação',
    descricao: 'Buraco de aproximadamente um metro na Rua Sete de Setembro, na altura do número 45.',
    endereco: 'Rua Sete de Setembro, 45 - Vila Nova',
    contato: null,
    status: 'em_execucao',
    criadoEm: '2026-10-18T08:41:00-03:00',
    atualizadoEm: '2026-10-21T14:10:00-03:00',
    historico: [
      { status: 'recebida', em: '2026-10-18T08:41:00-03:00', observacao: 'Solicitação registrada pelo aplicativo.' },
      { status: 'em_analise', em: '2026-10-19T09:05:00-03:00', observacao: 'Vistoria técnica agendada.' },
      { status: 'em_execucao', em: '2026-10-21T14:10:00-03:00', observacao: 'Equipe de pavimentação no local.' },
    ],
  },
]

const SENHA_DEMO = process.env.DEMO_PASSWORD || 'prefeitura-demo'

const USUARIOS_SEMENTE = [
  {
    id: 'usuario-admin',
    nome: 'Administrador Geral',
    email: 'admin@prefeitura.demo',
    papel: 'admin',
    setorId: null,
  },
  {
    id: 'usuario-triagem',
    nome: 'Equipe de Triagem',
    email: 'triagem@prefeitura.demo',
    papel: 'triagem',
    setorId: 'triagem',
  },
  {
    id: 'usuario-obras',
    nome: 'Equipe de Obras',
    email: 'obras@prefeitura.demo',
    papel: 'setor',
    setorId: 'infraestrutura',
  },
  {
    id: 'usuario-zeladoria',
    nome: 'Equipe de Zeladoria',
    email: 'zeladoria@prefeitura.demo',
    papel: 'setor',
    setorId: 'zeladoria',
  },
  {
    id: 'usuario-meio-ambiente',
    nome: 'Equipe de Meio Ambiente',
    email: 'ambiente@prefeitura.demo',
    papel: 'setor',
    setorId: 'meio_ambiente',
  },
  {
    id: 'usuario-fiscalizacao',
    nome: 'Equipe de Fiscalização',
    email: 'fiscalizacao@prefeitura.demo',
    papel: 'setor',
    setorId: 'fiscalizacao',
  },
  {
    id: 'usuario-mobilidade',
    nome: 'Equipe de Mobilidade',
    email: 'mobilidade@prefeitura.demo',
    papel: 'setor',
    setorId: 'mobilidade',
  },
  {
    id: 'usuario-ouvidoria',
    nome: 'Equipe de Ouvidoria',
    email: 'ouvidoria@prefeitura.demo',
    papel: 'setor',
    setorId: 'ouvidoria',
  },
]

/** @type {Array<object>} */
export const solicitacoes = []
/** @type {Array<object>} */
export const usuarios = []
/** @type {Array<object>} */
export const sessoes = []
export const configuracoes = criarConfiguracoesPadrao()
let sequencia = 3

function adicionarDias(iso, dias) {
  const data = new Date(iso)
  data.setDate(data.getDate() + dias)
  return data.toISOString()
}

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizarEmail(valor) {
  return String(valor ?? '').trim().toLowerCase()
}

function setorDoServico(tipo) {
  return setores.find(
    (setor) => !setor.central && Array.isArray(setor.servicos) && setor.servicos.includes(tipo),
  ) ?? setores.find((setor) => setor.central)
}

function normalizarSolicitacao(item) {
  const servico = servicos.find((servicoAtual) => servicoAtual.id === item.tipo)
  const criadoEm = item.criadoEm || new Date().toISOString()
  const prazoDias = Number(item.prazoDias) || servico?.prazoDias || 10
  const status = STATUS[item.status] ? item.status : 'recebida'
  const historico = Array.isArray(item.historico) && item.historico.length > 0
    ? item.historico
    : [{ status, em: criadoEm, observacao: 'Solicitação registrada pelo aplicativo.' }]
  const setorId = item.setorId || setorDoServico(item.tipo)?.id || 'triagem'

  return {
    ...item,
    tipoTitulo: item.tipoTitulo || servico?.titulo || 'Serviço',
    status,
    criadoEm,
    atualizadoEm: item.atualizadoEm || criadoEm,
    prazoDias,
    slaEm: item.slaEm || adicionarDias(criadoEm, prazoDias),
    prioridade: item.prioridade || 'normal',
    foto: item.foto || null,
    localizacao: item.localizacao || null,
    avaliacao: item.avaliacao || null,
    clientId: item.clientId || null,
    setorId,
    transferencias: Array.isArray(item.transferencias) ? item.transferencias : [],
    triagem: item.triagem && typeof item.triagem === 'object' ? item.triagem : null,
    historico,
  }
}

function normalizarUsuario(item) {
  const papel = PAPEIS[item.papel] ? item.papel : 'setor'
  const setorId = papel === 'setor'
    ? item.setorId || null
    : item.setorId || (papel === 'triagem' ? 'triagem' : null)
  return {
    id: item.id,
    nome: String(item.nome ?? '').trim(),
    email: normalizarEmail(item.email),
    senhaHash: item.senhaHash || (item.senha ? gerarHashSenha(item.senha) : null),
    papel,
    setorId,
    ativo: item.ativo !== false,
    criadoEm: item.criadoEm || new Date().toISOString(),
  }
}

function criarUsuariosSemente() {
  return USUARIOS_SEMENTE.map((usuario) =>
    normalizarUsuario({
      ...usuario,
      senha: SENHA_DEMO,
      criadoEm: new Date().toISOString(),
    }),
  )
}

function calcularSequencia() {
  return solicitacoes.reduce((maior, item) => {
    const numero = Number(String(item.protocolo).split('-').at(-1))
    return Number.isFinite(numero) && numero > maior ? numero : maior
  }, 0)
}

function carregar() {
  let carregadas = SOLICITACOES_SEMENTE
  let sequenciaSalva = 0
  let usuariosCarregados = null
  let sessoesCarregadas = []
  let configuracoesCarregadas = null

  if (existsSync(arquivoDados)) {
    try {
      const salvo = JSON.parse(readFileSync(arquivoDados, 'utf8'))
      if (Array.isArray(salvo.solicitacoes)) {
        carregadas = salvo.solicitacoes
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

  solicitacoes.length = 0
  solicitacoes.push(...carregadas.map(normalizarSolicitacao))
  sequencia = Math.max(sequenciaSalva, calcularSequencia())

  usuarios.length = 0
  usuarios.push(...(usuariosCarregados
    ? usuariosCarregados.map(normalizarUsuario)
    : criarUsuariosSemente()))

  Object.assign(configuracoes, normalizarConfiguracoes(configuracoesCarregadas ?? {}))

  const agora = Date.now()
  sessoes.length = 0
  sessoes.push(
    ...sessoesCarregadas.filter((sessao) => {
      const expira = new Date(sessao.expiraEm).getTime()
      return Number.isFinite(expira) && expira > agora && usuarios.some((u) => u.id === sessao.usuarioId && u.ativo)
    }),
  )
}

function persistir() {
  try {
    mkdirSync(dirname(arquivoDados), { recursive: true })
    writeFileSync(
      arquivoDados,
      JSON.stringify({
        versao: 3,
        salvoEm: new Date().toISOString(),
        sequencia,
        solicitacoes,
        usuarios,
        sessoes,
        configuracoes,
      }, null, 2),
    )
  } catch (erro) {
    console.error(`[dados] não foi possível salvar ${arquivoDados}:`, erro.message)
  }
}

carregar()

/** A configuração persistida passa a ser a fonte de verdade da automação. */
export function triagemAutomaticaAtiva() {
  return Boolean(configuracoes.ia.aplicarAutomaticamente)
}

export function obterConfiguracoesAdmin() {
  return configuracoesAdmin(configuracoes)
}

export function obterConfiguracoesPublicas() {
  return configuracoesPublicas(configuracoes)
}

export function salvarSecaoConfiguracoes(secao, dados, usuario) {
  if (!['identidade', 'email', 'ia'].includes(secao)) return null
  configuracoes[secao] = dados
  configuracoes.atualizadoEm = new Date().toISOString()
  configuracoes.atualizadoPor = usuario
    ? { id: usuario.id, nome: usuario.nome }
    : null
  persistir()
  return configuracoesAdmin(configuracoes)
}

export function registrarNotificacao(registro) {
  const notificacao = {
    id: `notificacao-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    evento: String(registro.evento ?? 'evento'),
    canal: 'email',
    status: ['enviado', 'erro', 'ignorado'].includes(registro.status)
      ? registro.status
      : 'erro',
    destinatarios: Array.isArray(registro.destinatarios) ? registro.destinatarios : [],
    assunto: String(registro.assunto ?? ''),
    protocolo: registro.protocolo ? String(registro.protocolo) : null,
    codigo: registro.codigo ? String(registro.codigo).slice(0, 80) : null,
    erro: registro.erro ? String(registro.erro).slice(0, 400) : null,
    em: new Date().toISOString(),
  }
  configuracoes.notificacoes.unshift(notificacao)
  configuracoes.notificacoes = configuracoes.notificacoes.slice(0, 30)
  persistir()
  return notificacao
}

export function listarServicos() {
  return [...servicos].sort((a, b) => a.ordem - b.ordem)
}

export function buscarServico(id) {
  return servicos.find((servico) => servico.id === id)
}

export function listarAvisos() {
  return [...avisos].sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm))
}

export function listarSetores({ incluirInativos = false } = {}) {
  return setores
    .filter((setor) => incluirInativos || setor.ativo)
    .map((setor) => ({ ...setor, servicos: [...setor.servicos] }))
}

export function buscarSetor(id) {
  return setores.find((setor) => setor.id === id) ?? null
}

export function setorPublico(id) {
  const setor = buscarSetor(id)
  if (!setor) return null
  return {
    id: setor.id,
    nome: setor.nome,
    secretaria: setor.secretaria,
    central: Boolean(setor.central),
  }
}

export function buscarSolicitacao(protocolo) {
  const alvo = String(protocolo ?? '').toUpperCase().trim()
  return solicitacoes.find((item) => item.protocolo === alvo)
}

export function buscarSolicitacaoPorClientId(clientId) {
  if (!clientId) return null
  return solicitacoes.find((item) => item.clientId === clientId) ?? null
}

export function listarSolicitacoes({ status, tipo, busca, setorId, ids, limite = 100 } = {}) {
  let dados = [...solicitacoes].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
  )

  if (status) dados = dados.filter((item) => item.status === status)
  if (tipo) dados = dados.filter((item) => item.tipo === tipo)
  if (setorId) dados = dados.filter((item) => item.setorId === setorId)
  if (Array.isArray(ids) && ids.length > 0) {
    const alvos = new Set(ids.map((id) => String(id).toUpperCase()))
    dados = dados.filter((item) => alvos.has(item.protocolo))
  }

  const termo = normalizarTexto(busca)
  if (termo) {
    dados = dados.filter((item) =>
      normalizarTexto(
        `${item.protocolo} ${item.tipoTitulo} ${item.endereco} ${item.descricao} ${buscarSetor(item.setorId)?.nome ?? ''}`,
      ).includes(termo),
    )
  }

  const total = dados.length
  const limiteSeguro = Math.max(1, Math.min(Number(limite) || 100, 500))
  return { dados: dados.slice(0, limiteSeguro), total }
}

export function criarSolicitacao({
  tipo,
  descricao,
  endereco,
  contato,
  foto = null,
  localizacao = null,
  clientId = null,
  sugestao: sugestaoExterna = null,
}) {
  const existente = buscarSolicitacaoPorClientId(clientId)
  if (existente) return { solicitacao: existente, criada: false }

  const agora = new Date().toISOString()
  const servico = buscarServico(tipo)
  const sugestao = sugestaoExterna ?? classificarSolicitacao({ tipo, descricao, endereco, setores })
  const automatica = triagemAutomaticaAtiva()
  const setorSugerido = setores.find(
    (setor) => setor.id === sugestao.setorId && !setor.central,
  )
  const setorInicialId = automatica && sugestao.confianca >= 0.5 && setorSugerido
    ? setorSugerido.id
    : 'triagem'
  sequencia += 1

  const solicitacao = normalizarSolicitacao({
    protocolo: `PREF-${new Date().getFullYear()}-${String(sequencia).padStart(6, '0')}`,
    tipo,
    tipoTitulo: servico.titulo,
    descricao: descricao.trim(),
    endereco: endereco.trim(),
    contato: contato?.trim() || null,
    status: 'recebida',
    criadoEm: agora,
    atualizadoEm: agora,
    prazoDias: servico.prazoDias,
    prioridade: 'normal',
    foto,
    localizacao,
    clientId,
    setorId: setorInicialId,
    transferencias: [],
    triagem: {
      ...sugestao,
      automatica,
      aplicada: automatica,
      setorSugeridoId: sugestao.setorId,
      setorInicialId,
      modelo: sugestao.modelo || MODELO_TRIAGEM,
    },
    historico: [
      { status: 'recebida', em: agora, observacao: 'Solicitação registrada pelo aplicativo.' },
    ],
  })

  solicitacoes.unshift(solicitacao)
  persistir()
  return { solicitacao, criada: true }
}

export function atualizarStatus(protocolo, { status, observacao, prioridade, porUsuario }) {
  const solicitacao = buscarSolicitacao(protocolo)
  if (!solicitacao) return null

  const agora = new Date().toISOString()
  solicitacao.status = status
  solicitacao.atualizadoEm = agora
  if (prioridade) solicitacao.prioridade = prioridade
  solicitacao.historico.push({
    status,
    em: agora,
    observacao: observacao?.trim() || `Status atualizado para ${STATUS[status]}.`,
    ...(porUsuario ? { por: { id: porUsuario.id, nome: porUsuario.nome } } : {}),
  })
  if (status === 'concluida') solicitacao.concluidoEm = agora
  persistir()
  return solicitacao
}

/**
 * A transferência é um evento auditável: o status principal (em análise, em
 * execução etc.) é preservado. O SLA original também é preservado, a menos que
 * o operador marque explicitamente recalcularSla.
 */
export function transferirSolicitacao(protocolo, {
  setorDestinoId,
  motivo,
  tipoDestino,
  recalcularSla = false,
  porUsuario,
}) {
  const solicitacao = buscarSolicitacao(protocolo)
  if (!solicitacao) return { erro: 'nao_encontrada' }

  const destino = buscarSetor(setorDestinoId)
  if (!destino || !destino.ativo) return { erro: 'setor_invalido' }

  const tipoFinal = tipoDestino || solicitacao.tipo
  const servicoFinal = buscarServico(tipoFinal)
  if (!servicoFinal) return { erro: 'servico_invalido' }

  const deSetorId = solicitacao.setorId
  const deTipo = solicitacao.tipo
  const agora = new Date().toISOString()
  const transferencia = {
    deSetorId,
    paraSetorId: destino.id,
    deTipo,
    paraTipo: tipoFinal,
    motivo: String(motivo ?? '').trim(),
    recalculouSla: Boolean(recalcularSla && tipoFinal !== deTipo),
    por: porUsuario ? { id: porUsuario.id, nome: porUsuario.nome } : null,
    em: agora,
  }

  solicitacao.setorId = destino.id
  solicitacao.atualizadoEm = agora
  solicitacao.transferencias.push(transferencia)

  if (tipoFinal !== deTipo) {
    solicitacao.tipo = tipoFinal
    solicitacao.tipoTitulo = servicoFinal.titulo
    if (recalcularSla) {
      solicitacao.prazoDias = servicoFinal.prazoDias
      solicitacao.slaEm = adicionarDias(solicitacao.criadoEm, servicoFinal.prazoDias)
      transferencia.slaRecalculadoEm = solicitacao.slaEm
    }
  }

  solicitacao.historico.push({
    status: solicitacao.status,
    em: agora,
    tipo: 'transferencia',
    observacao: `Transferida de ${buscarSetor(deSetorId)?.nome ?? 'Triagem'} para ${destino.nome}.${motivo ? ` Motivo: ${String(motivo).trim()}` : ''}`,
    ...(porUsuario ? { por: { id: porUsuario.id, nome: porUsuario.nome } } : {}),
  })

  persistir()
  return { solicitacao, transferencia }
}

export function avaliarSolicitacao(protocolo, { nota, comentario }) {
  const solicitacao = buscarSolicitacao(protocolo)
  if (!solicitacao) return null

  solicitacao.avaliacao = {
    nota,
    comentario: comentario?.trim() || null,
    em: new Date().toISOString(),
  }
  persistir()
  return solicitacao
}

export function listarSemelhantes({ tipo, endereco, latitude, longitude }) {
  if (!tipo) return []

  const tokens = normalizarTexto(endereco)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3)
  const lat = Number(latitude)
  const lng = Number(longitude)
  const temCoordenadas = Number.isFinite(lat) && Number.isFinite(lng)

  return solicitacoes
    .filter((item) => item.tipo === tipo && STATUS_ABERTOS.includes(item.status))
    .map((item) => {
      const tokensItem = normalizarTexto(item.endereco)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 3)
      const comuns = tokens.filter((token) => tokensItem.includes(token)).length
      const textoParecido =
        Boolean(endereco) &&
        (normalizarTexto(item.endereco).includes(normalizarTexto(endereco)) ||
          normalizarTexto(endereco).includes(normalizarTexto(item.endereco)))

      let distanciaMetros = null
      if (temCoordenadas && item.localizacao) {
        const dLat = (lat - Number(item.localizacao.latitude)) * 111_320
        const dLng =
          (lng - Number(item.localizacao.longitude)) *
          111_320 *
          Math.cos((lat * Math.PI) / 180)
        distanciaMetros = Math.round(Math.sqrt(dLat ** 2 + dLng ** 2))
      }

      const corresponde =
        (tokens.length > 0 && comuns >= 2) ||
        textoParecido ||
        (distanciaMetros !== null && distanciaMetros <= 300)

      return { item, corresponde, distanciaMetros }
    })
    .filter(({ corresponde }) => corresponde)
    .slice(0, 3)
    .map(({ item, distanciaMetros }) => ({
      protocolo: item.protocolo,
      tipo: item.tipo,
      tipoTitulo: item.tipoTitulo,
      status: item.status,
      criadoEm: item.criadoEm,
      atualizadoEm: item.atualizadoEm,
      distanciaMetros,
    }))
}

export function estatisticasGestao({ setorId } = {}) {
  const base = setorId ? solicitacoes.filter((item) => item.setorId === setorId) : solicitacoes
  const agora = Date.now()
  const abertas = base.filter((item) => STATUS_ABERTOS.includes(item.status))
  const atrasadas = abertas.filter((item) => new Date(item.slaEm).getTime() < agora)
  const avaliacoes = base.filter((item) => item.avaliacao?.nota)
  const mediaAvaliacao = avaliacoes.length
    ? avaliacoes.reduce((soma, item) => soma + item.avaliacao.nota, 0) / avaliacoes.length
    : null

  return {
    total: base.length,
    abertas: abertas.length,
    atrasadas: atrasadas.length,
    concluidas: base.filter((item) => item.status === 'concluida').length,
    avaliacoes: avaliacoes.length,
    mediaAvaliacao: mediaAvaliacao ? Number(mediaAvaliacao.toFixed(1)) : null,
  }
}

export function autenticarUsuario(email, senha) {
  const alvo = normalizarEmail(email)
  const usuario = usuarios.find((item) => item.email === alvo)
  if (!usuario || !usuario.ativo || !verificarSenha(senha, usuario.senhaHash)) return null
  return usuario
}

export function usuarioPublico(usuario) {
  if (!usuario) return null
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    setorId: usuario.setorId,
    setor: setorPublico(usuario.setorId),
    ativo: usuario.ativo,
  }
}

export function listarUsuarios() {
  return [...usuarios]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map(usuarioPublico)
}

export function buscarUsuario(id) {
  return usuarios.find((usuario) => usuario.id === id) ?? null
}

export function criarUsuario({ nome, email, senha, papel, setorId }) {
  const emailNormalizado = normalizarEmail(email)
  if (!emailNormalizado) return { erro: 'email_obrigatorio' }
  if (usuarios.some((usuario) => usuario.email === emailNormalizado)) {
    return { erro: 'email_em_uso' }
  }
  if (!PAPEIS[papel]) return { erro: 'papel_invalido' }
  const setor = papel === 'setor' ? buscarSetor(setorId) : null
  if (papel === 'setor' && (!setor || !setor.ativo)) return { erro: 'setor_invalido' }

  const usuario = normalizarUsuario({
    id: `usuario-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome,
    email: emailNormalizado,
    senha,
    papel,
    setorId: papel === 'setor' ? setorId : (papel === 'triagem' ? 'triagem' : null),
    ativo: true,
    criadoEm: new Date().toISOString(),
  })
  usuarios.push(usuario)
  persistir()
  return { usuario: usuarioPublico(usuario) }
}

export function atualizarUsuario(id, { nome, email, senha, papel, setorId, ativo }) {
  const usuario = buscarUsuario(id)
  if (!usuario) return { erro: 'nao_encontrado' }

  let emailNormalizado
  if (email !== undefined) {
    emailNormalizado = normalizarEmail(email)
    if (!emailNormalizado) return { erro: 'email_obrigatorio' }
    if (usuarios.some((outro) => outro.id !== id && outro.email === emailNormalizado)) {
      return { erro: 'email_em_uso' }
    }
  }
  if (papel !== undefined && !PAPEIS[papel]) return { erro: 'papel_invalido' }

  // Calcula o estado final antes de alterar o objeto: uma validação que falha
  // não pode deixar o usuário em memória com papel/setor inconsistentes.
  const papelFinal = papel ?? usuario.papel
  let setorFinal = null
  if (papelFinal === 'setor') {
    setorFinal = setorId !== undefined
      ? setorId
      : (usuario.papel === 'setor' ? usuario.setorId : null)
    const setor = buscarSetor(setorFinal)
    if (!setor || !setor.ativo) return { erro: 'setor_invalido' }
  } else if (papelFinal === 'triagem') {
    setorFinal = 'triagem'
  }

  if (emailNormalizado !== undefined) usuario.email = emailNormalizado
  if (nome !== undefined) usuario.nome = String(nome).trim()
  if (senha) usuario.senhaHash = gerarHashSenha(senha)
  usuario.papel = papelFinal
  usuario.setorId = setorFinal
  if (ativo !== undefined) usuario.ativo = Boolean(ativo)
  persistir()
  return { usuario: usuarioPublico(usuario) }
}

export function criarSessao(usuarioId, { lembrar = false } = {}) {
  const agora = Date.now()
  const duracaoMs = lembrar
    ? DIAS_SESSAO_LEMBRAR * 24 * 60 * 60 * 1000
    : HORAS_SESSAO_PADRAO * 60 * 60 * 1000
  const token = gerarTokenSessao()
  const sessao = {
    tokenHash: hashToken(token),
    usuarioId,
    lembrar: Boolean(lembrar),
    criadaEm: new Date(agora).toISOString(),
    expiraEm: new Date(agora + duracaoMs).toISOString(),
  }
  sessoes.push(sessao)
  persistir()
  return { token, sessao }
}

export function usuarioDaSessao(token) {
  if (!token) return null
  const alvo = hashToken(token)
  const indice = sessoes.findIndex((sessao) => sessao.tokenHash === alvo)
  if (indice < 0) return null
  const sessao = sessoes[indice]
  if (new Date(sessao.expiraEm).getTime() <= Date.now()) {
    sessoes.splice(indice, 1)
    return null
  }
  const usuario = buscarUsuario(sessao.usuarioId)
  if (!usuario || !usuario.ativo) return null
  return usuario
}

export function revogarSessao(token) {
  if (!token) return false
  const alvo = hashToken(token)
  const tamanho = sessoes.length
  for (let indice = sessoes.length - 1; indice >= 0; indice -= 1) {
    if (sessoes[indice].tokenHash === alvo) sessoes.splice(indice, 1)
  }
  const removeu = sessoes.length !== tamanho
  if (removeu) persistir()
  return removeu
}

export function reiniciar() {
  solicitacoes.length = 0
  solicitacoes.push(...SOLICITACOES_SEMENTE.map(normalizarSolicitacao))
  sequencia = calcularSequencia()
  sessoes.length = 0
  persistir()
}
