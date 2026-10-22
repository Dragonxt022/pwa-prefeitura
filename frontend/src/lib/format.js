const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatarData(iso) {
  if (!iso) return '—'
  const valor = new Date(iso)
  return Number.isNaN(valor.getTime()) ? '—' : data.format(valor)
}

export function formatarDataHora(iso) {
  if (!iso) return '—'
  const valor = new Date(iso)
  return Number.isNaN(valor.getTime()) ? '—' : dataHora.format(valor)
}

export const STATUS_INFO = {
  recebida: {
    rotulo: 'Recebida',
    tom: 'info',
    descricao: 'Solicitação registrada e aguardando triagem da equipe responsável.',
  },
  em_analise: {
    rotulo: 'Em análise',
    tom: 'atencao',
    descricao: 'A equipe está avaliando o local e definindo o encaminhamento.',
  },
  em_execucao: {
    rotulo: 'Em execução',
    tom: 'execucao',
    descricao: 'Serviço programado ou em andamento no endereço informado.',
  },
  concluida: {
    rotulo: 'Concluída',
    tom: 'sucesso',
    descricao: 'Serviço concluído. Se o problema persistir, abra uma nova solicitação.',
  },
  indeferida: {
    rotulo: 'Indeferida',
    tom: 'erro',
    descricao: 'A solicitação não pôde ser atendida. Consulte o histórico para detalhes.',
  },
}

export function infoStatus(status) {
  return STATUS_INFO[status] ?? { rotulo: status ?? 'Desconhecido', tom: 'info', descricao: '' }
}

export const PRIORIDADE_INFO = {
  alta: { rotulo: 'Urgente', tom: 'erro' },
  normal: { rotulo: 'Informativo', tom: 'info' },
  baixa: { rotulo: 'Aviso', tom: 'neutro' },
}

export function infoPrioridade(prioridade) {
  return PRIORIDADE_INFO[prioridade] ?? { rotulo: 'Aviso', tom: 'neutro' }
}

export function normalizarProtocolo(valor) {
  return String(valor ?? '').trim().toUpperCase()
}

/** Formato esperado: PREF-AAAA-000000 (validado só no cliente, como atalho de UX). */
export function protocoloPareceValido(valor) {
  return /^PREF-\d{4}-\d{6}$/.test(normalizarProtocolo(valor))
}
