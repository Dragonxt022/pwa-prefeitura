/**
 * Store do piloto com persistencia simples em JSON.
 *
 * O arquivo de dados fica fora do Git (backend/data/estado.json) e pode ser
 * trocado com a variavel DATA_FILE. A escrita e suficiente para o piloto,
 * mas nao substitui um banco de dados transacional.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raizBackend = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arquivoDados = process.env.DATA_FILE
  ? resolve(process.env.DATA_FILE)
  : resolve(raizBackend, 'data', 'estado.json')

export const STATUS = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  indeferida: 'Indeferida',
}

export const STATUS_ABERTOS = ['recebida', 'em_analise', 'em_execucao']
export const STATUS_FINAIS = ['concluida', 'indeferida']

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

/** @type {Array<object>} */
export const solicitacoes = []
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

function normalizarSolicitacao(item) {
  const servico = servicos.find((servicoAtual) => servicoAtual.id === item.tipo)
  const criadoEm = item.criadoEm || new Date().toISOString()
  const prazoDias = Number(item.prazoDias) || servico?.prazoDias || 10
  const status = STATUS[item.status] ? item.status : 'recebida'
  const historico = Array.isArray(item.historico) && item.historico.length > 0
    ? item.historico
    : [{ status, em: criadoEm, observacao: 'Solicitação registrada pelo aplicativo.' }]

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
    historico,
  }
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

  if (existsSync(arquivoDados)) {
    try {
      const salvo = JSON.parse(readFileSync(arquivoDados, 'utf8'))
      if (Array.isArray(salvo.solicitacoes)) {
        carregadas = salvo.solicitacoes
        sequenciaSalva = Number(salvo.sequencia) || 0
      }
    } catch (erro) {
      console.warn(`[dados] não foi possível ler ${arquivoDados}:`, erro.message)
    }
  }

  solicitacoes.length = 0
  solicitacoes.push(...carregadas.map(normalizarSolicitacao))
  sequencia = Math.max(sequenciaSalva, calcularSequencia())
}

function persistir() {
  try {
    mkdirSync(dirname(arquivoDados), { recursive: true })
    writeFileSync(
      arquivoDados,
      JSON.stringify({ versao: 1, salvoEm: new Date().toISOString(), sequencia, solicitacoes }, null, 2),
    )
  } catch (erro) {
    console.error(`[dados] não foi possível salvar ${arquivoDados}:`, erro.message)
  }
}

carregar()

export function listarServicos() {
  return [...servicos].sort((a, b) => a.ordem - b.ordem)
}

export function buscarServico(id) {
  return servicos.find((servico) => servico.id === id)
}

export function listarAvisos() {
  return [...avisos].sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm))
}

export function buscarSolicitacao(protocolo) {
  const alvo = String(protocolo ?? '').toUpperCase().trim()
  return solicitacoes.find((item) => item.protocolo === alvo)
}

export function buscarSolicitacaoPorClientId(clientId) {
  if (!clientId) return null
  return solicitacoes.find((item) => item.clientId === clientId) ?? null
}

export function listarSolicitacoes({ status, tipo, busca, limite = 100 } = {}) {
  let dados = [...solicitacoes].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
  )

  if (status) dados = dados.filter((item) => item.status === status)
  if (tipo) dados = dados.filter((item) => item.tipo === tipo)

  const termo = normalizarTexto(busca)
  if (termo) {
    dados = dados.filter((item) =>
      normalizarTexto(
        `${item.protocolo} ${item.tipoTitulo} ${item.endereco} ${item.descricao}`,
      ).includes(termo),
    )
  }

  const total = dados.length
  return { dados: dados.slice(0, Math.max(1, Math.min(Number(limite) || 100, 100))), total }
}

export function criarSolicitacao({
  tipo,
  descricao,
  endereco,
  contato,
  foto = null,
  localizacao = null,
  clientId = null,
}) {
  const existente = buscarSolicitacaoPorClientId(clientId)
  if (existente) return { solicitacao: existente, criada: false }

  const agora = new Date().toISOString()
  const servico = buscarServico(tipo)
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
    historico: [
      { status: 'recebida', em: agora, observacao: 'Solicitação registrada pelo aplicativo.' },
    ],
  })

  solicitacoes.unshift(solicitacao)
  persistir()
  return { solicitacao, criada: true }
}

export function atualizarStatus(protocolo, { status, observacao, prioridade }) {
  const solicitacao = buscarSolicitacao(protocolo)
  if (!solicitacao) return null

  const agora = new Date().toISOString()
  solicitacao.status = status
  solicitacao.atualizadoEm = agora
  if (prioridade) solicitacao.prioridade = prioridade
  if (observacao?.trim()) {
    solicitacao.historico.push({
      status,
      em: agora,
      observacao: observacao.trim(),
    })
  } else {
    solicitacao.historico.push({
      status,
      em: agora,
      observacao: `Status atualizado para ${STATUS[status]}.`,
    })
  }
  if (status === 'concluida') solicitacao.concluidoEm = agora
  persistir()
  return solicitacao
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

export function estatisticasGestao() {
  const agora = Date.now()
  const abertas = solicitacoes.filter((item) => STATUS_ABERTOS.includes(item.status))
  const atrasadas = abertas.filter((item) => new Date(item.slaEm).getTime() < agora)
  const avaliacoes = solicitacoes.filter((item) => item.avaliacao?.nota)
  const mediaAvaliacao = avaliacoes.length
    ? avaliacoes.reduce((soma, item) => soma + item.avaliacao.nota, 0) / avaliacoes.length
    : null

  return {
    total: solicitacoes.length,
    abertas: abertas.length,
    atrasadas: atrasadas.length,
    concluidas: solicitacoes.filter((item) => item.status === 'concluida').length,
    avaliacoes: avaliacoes.length,
    mediaAvaliacao: mediaAvaliacao ? Number(mediaAvaliacao.toFixed(1)) : null,
  }
}

export function reiniciar() {
  solicitacoes.length = 0
  solicitacoes.push(...SOLICITACOES_SEMENTE.map(normalizarSolicitacao))
  sequencia = calcularSequencia()
  persistir()
}
