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

const cache = { avisos: [] }

function clonar(valor) {
  return valor ? structuredClone(valor) : valor
}

function dataIso(valor) {
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data.toISOString()
}

/** Substitui o cache pelo estado vindo do repositório. */
export function aplicarAvisos(lista = []) {
  cache.avisos = lista.map((aviso) => ({
    ...aviso,
    prioridade: aviso.prioridade ?? 'normal',
    categoria: aviso.categoria ?? '',
    publicadoEm: dataIso(aviso.publicadoEm) ?? new Date().toISOString(),
    ativo: aviso.ativo !== false,
  }))
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

export function avisosAtuais() {
  return clonar(cache.avisos)
}

aplicarAvisos(avisosSemente)
