/**
 * Avisos da cidade.
 *
 * As sementes alimentam a primeira carga do repositório. O cache mantém a
 * leitura síncrona usada pela Home e pelo painel; a gravação fica no
 * repositório de avisos.
 */

export const avisosSemente = [
  {
    id: 'aviso-1',
    titulo: 'Vacinação antirrábica neste sábado',
    resumo: 'Postos móveis em três bairros, das 8h às 16h. Leve o cartão de vacinação do animal.',
    conteudo:
      'A Secretaria Municipal de Saúde realiza neste sábado uma ação de vacinação antirrábica para cães e gatos em três pontos da cidade.\n\nOs postos móveis ficam no Centro (Praça da Matriz), no Jardim das Acácias (unidade de saúde do bairro) e no Bairro Novo (Escola Municipal Vila Nova). O atendimento acontece das 8h às 16h, por ordem de chegada.\n\nLeve o cartão de vacinação do animal e mantenha cães na coleira e gatos em caixa de transporte. A vacina é gratuita e indicada para animais a partir de três meses de idade.',
    publicadoEm: '2026-10-20T13:00:00-03:00',
    prioridade: 'alta',
    categoria: 'Saúde',
    icone: 'paw-print',
    cor: 'coral',
  },
  {
    id: 'aviso-2',
    titulo: 'Manutenção programada no portal',
    resumo: 'O acompanhamento de protocolos fica indisponível das 22h às 23h30 desta quinta-feira.',
    conteudo:
      'O portal de atendimento da prefeitura passará por manutenção programada nesta quinta-feira, das 22h às 23h30.\n\nDurante o período, o acompanhamento de protocolos e o envio de novas solicitações podem ficar temporariamente indisponíveis. A consulta a avisos e ao catálogo de serviços continua funcionando.\n\nSe você precisar de atendimento urgente nesse horário, procure a Central de Atendimento. A equipe responsável acompanha a operação e comunicará qualquer mudança neste mesmo aviso.',
    publicadoEm: '2026-10-19T09:30:00-03:00',
    prioridade: 'normal',
    categoria: 'Serviço',
    icone: 'info',
    cor: 'azul',
  },
  {
    id: 'aviso-3',
    titulo: 'Nova unidade de saúde no Jardim das Acácias',
    resumo: 'Atendimento começa na segunda-feira, das 7h às 19h, com clínico geral e pediatria.',
    conteudo:
      'A nova unidade de saúde do Jardim das Acácias começa a atender na próxima segunda-feira, das 7h às 19h.\n\nA equipe inicial conta com clínico geral, pediatria e enfermagem. O agendamento pode ser feito pelo próprio portal ou presencialmente, mediante documento com foto e comprovante de residência.\n\nA unidade fica na Rua das Acácias, 120, ao lado da escola municipal. O atendimento de urgência e emergência continua sendo realizado no Hospital Municipal.',
    publicadoEm: '2026-10-16T16:45:00-03:00',
    prioridade: 'normal',
    categoria: 'Saúde',
    icone: 'hospital',
    cor: 'teal',
  },
  {
    id: 'aviso-4',
    titulo: 'Coleta seletiva ampliada',
    resumo: 'Mais quatro bairros passam a ter coleta seletiva semanal a partir de novembro.',
    conteudo:
      'A partir do dia 1º de novembro, mais quatro bairros passam a contar com coleta seletiva semanal: Vila Nova, Jardim das Acácias, Bela Vista e Parque das Flores.\n\nA coleta acontece às terças-feiras, a partir das 7h. Os moradores devem separar papel, plástico, vidro e metal, sempre limpos, e depositar o material em sacos ou caixas identificados.\n\nMateriais orgânicos e rejeitos continuam sendo recolhidos no calendário regular da coleta comum. Em caso de dúvidas, procure a equipe de Zeladoria pelo canal de atendimento da prefeitura.',
    publicadoEm: '2026-10-14T11:15:00-03:00',
    prioridade: 'baixa',
    categoria: 'Zeladoria',
    icone: 'recycle',
    cor: 'verde',
  },
]

const cache = { avisos: [] }

function clonar(valor) {
  return valor ? structuredClone(valor) : valor
}

function dataIso(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data.toISOString()
}

/** Substitui o cache pelo estado vindo do repositório. */
export function aplicarAvisos(lista = []) {
  cache.avisos = lista.map((aviso) => ({
    ...aviso,
    prioridade: aviso.prioridade ?? 'normal',
    categoria: aviso.categoria ?? '',
    conteudo: aviso.conteudo || aviso.resumo || '',
    icone: aviso.icone || null,
    cor: aviso.cor || null,
    publicadoEm: dataIso(aviso.publicadoEm) ?? new Date().toISOString(),
    expiraEm: dataIso(aviso.expiraEm),
    desativarAoExpirar: aviso.desativarAoExpirar !== false,
    visualizacoes: Math.max(0, Number(aviso.visualizacoes) || 0),
    ativo: aviso.ativo !== false,
  }))
}

/** Um aviso expirado deixa de ser público quando a desativação automática está ligada. */
export function avisoExpirado(aviso, agora = new Date()) {
  if (!aviso || aviso.desativarAoExpirar === false || !aviso.expiraEm) return false
  const expiraEm = new Date(aviso.expiraEm)
  return !Number.isNaN(expiraEm.getTime()) && expiraEm <= agora
}

/**
 * Lista pública (padrão) ou administrativa dos avisos.
 *
 * Na listagem pública, só entram avisos ativos já publicados, do mais recente
 * para o mais antigo.
 */
export function listarAvisos({ incluirInativos = false, agora = new Date() } = {}) {
  return cache.avisos
    .filter((aviso) => {
      if (incluirInativos) return true
      if (!aviso.ativo) return false
      if (avisoExpirado(aviso, agora)) return false
      const publicado = new Date(aviso.publicadoEm)
      return !Number.isNaN(publicado.getTime()) && publicado <= agora
    })
    .sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm))
    .map((aviso) => clonar(aviso))
}

export function buscarAviso(id, { incluirInativos = true } = {}) {
  return clonar(
    cache.avisos.find(
      (aviso) => aviso.id === id && (incluirInativos || aviso.ativo),
    ),
  ) ?? null
}

/** Aviso publicado (ativo e com data já alcançada) para a leitura pública. */
export function buscarAvisoPublico(id, { agora = new Date() } = {}) {
  const aviso = cache.avisos.find((item) => item.id === id && item.ativo)
  if (!aviso) return null
  if (avisoExpirado(aviso, agora)) return null
  const publicadoEm = new Date(aviso.publicadoEm)
  if (Number.isNaN(publicadoEm.getTime()) || publicadoEm > agora) return null
  return clonar(aviso)
}

export function avisosAtuais() {
  return clonar(cache.avisos)
}

/** Incrementa a leitura no cache e devolve uma cópia atualizada. */
export function contarVisualizacao(id) {
  const aviso = cache.avisos.find((item) => item.id === id)
  if (!aviso) return null
  aviso.visualizacoes = Math.max(0, Number(aviso.visualizacoes) || 0) + 1
  return clonar(aviso)
}

aplicarAvisos(avisosSemente)
