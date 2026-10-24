import {
  Building2,
  CircleCheck,
  CircleX,
  Construction,
  Fence,
  Hammer,
  HeartPulse,
  Inbox,
  Leaf,
  Lightbulb,
  Megaphone,
  MessagesSquare,
  ScanSearch,
  Signpost,
  Trash2,
  TreePine,
  Wrench,
} from 'lucide-react'

/**
 * Traduz os dados da API para a camada visual:
 * ícone, tom e um rótulo curto (sem descrições longas).
 */
export const SERVICOS_VISUAL = {
  iluminacao: { rotulo: 'Iluminação', Icone: Lightbulb, tom: 'ambar' },
  pavimentacao: { rotulo: 'Pavimentação', Icone: Construction, tom: 'coral' },
  limpeza: { rotulo: 'Limpeza', Icone: Trash2, tom: 'verde' },
  poda: { rotulo: 'Poda', Icone: TreePine, tom: 'teal' },
  fiscalizacao: { rotulo: 'Fiscalização', Icone: Fence, tom: 'roxo' },
  sinalizacao: { rotulo: 'Sinalização', Icone: Signpost, tom: 'azul' },
  ouvidoria: { rotulo: 'Ouvidoria', Icone: MessagesSquare, tom: 'ambar' },
  zeladoria: { rotulo: 'Zeladoria', Icone: Building2, tom: 'teal' },
  meio_ambiente: { rotulo: 'Meio ambiente', Icone: Leaf, tom: 'verde' },
}

const SERVICO_PADRAO = { rotulo: 'Serviço', Icone: Wrench, tom: 'azul' }

export function visualServico(id) {
  return SERVICOS_VISUAL[id] ?? SERVICO_PADRAO
}

const AVISOS_VISUAL = {
  Saúde: { Icone: HeartPulse, tom: 'coral' },
  Serviço: { Icone: Wrench, tom: 'azul' },
  Zeladoria: { Icone: Trash2, tom: 'verde' },
}

export function visualAviso(categoria) {
  return AVISOS_VISUAL[categoria] ?? { Icone: Megaphone, tom: 'ambar' }
}

const STATUS_VISUAL = {
  recebida: { Icone: Inbox, tom: 'azul' },
  em_analise: { Icone: ScanSearch, tom: 'ambar' },
  em_execucao: { Icone: Hammer, tom: 'roxo' },
  concluida: { Icone: CircleCheck, tom: 'verde' },
  indeferida: { Icone: CircleX, tom: 'coral' },
}

export function visualStatus(status) {
  return STATUS_VISUAL[status] ?? { Icone: Inbox, tom: 'azul' }
}
