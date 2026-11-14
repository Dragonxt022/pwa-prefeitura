import {
  Accessibility,
  Baby,
  BookOpen,
  Briefcase,
  BrushCleaning,
  Building2,
  Bus,
  CalendarDays,
  CircleCheck,
  CircleX,
  Construction,
  Dog,
  Droplets,
  Fence,
  Flower2,
  Hammer,
  HeartPulse,
  Hospital,
  Inbox,
  Info,
  Leaf,
  Lightbulb,
  MapPin,
  Megaphone,
  PawPrint,
  Recycle,
  Road,
  ScanSearch,
  School,
  ShieldCheck,
  Signpost,
  Stethoscope,
  TrafficCone,
  Trash2,
  TreePine,
  TriangleAlert,
  Users,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react'
import { IDS_TONS } from '../../../shared/catalogo-visual.js'

/**
 * Traduz os identificadores estáveis do catálogo visual para componentes
 * Lucide. O mapeamento é explícito para não incluir todos os ícones no bundle.
 */
const ICONES = {
  accessibility: Accessibility,
  baby: Baby,
  'book-open': BookOpen,
  briefcase: Briefcase,
  'brush-cleaning': BrushCleaning,
  'building-2': Building2,
  bus: Bus,
  'calendar-days': CalendarDays,
  construction: Construction,
  dog: Dog,
  droplets: Droplets,
  fence: Fence,
  'flower-2': Flower2,
  hammer: Hammer,
  'heart-pulse': HeartPulse,
  hospital: Hospital,
  info: Info,
  leaf: Leaf,
  lightbulb: Lightbulb,
  'map-pin': MapPin,
  megaphone: Megaphone,
  'paw-print': PawPrint,
  recycle: Recycle,
  road: Road,
  school: School,
  'shield-check': ShieldCheck,
  signpost: Signpost,
  stethoscope: Stethoscope,
  'traffic-cone': TrafficCone,
  'trash-2': Trash2,
  'tree-pine': TreePine,
  'triangle-alert': TriangleAlert,
  users: Users,
  utensils: Utensils,
  wrench: Wrench,
  zap: Zap,
}

export function iconeVisual(id) {
  return ICONES[id] ?? null
}

export function tomVisual(id) {
  return IDS_TONS.includes(id) ? id : null
}

/**
 * Traduz os dados da API para a camada visual:
 * ícone, tom e um rótulo curto (sem descrições longas).
 *
 * Aceita o identificador do serviço (compatibilidade) ou o objeto completo,
 * quando o cadastro administrativo define ícone e cor próprios.
 */
export const SERVICOS_VISUAL = {
  iluminacao: { rotulo: 'Iluminação', Icone: Lightbulb, tom: 'ambar' },
  pavimentacao: { rotulo: 'Pavimentação', Icone: Construction, tom: 'coral' },
  limpeza: { rotulo: 'Limpeza', Icone: Trash2, tom: 'verde' },
  poda: { rotulo: 'Poda', Icone: TreePine, tom: 'teal' },
  fiscalizacao: { rotulo: 'Fiscalização', Icone: Fence, tom: 'roxo' },
  sinalizacao: { rotulo: 'Sinalização', Icone: Signpost, tom: 'azul' },
  zeladoria: { rotulo: 'Zeladoria', Icone: Building2, tom: 'teal' },
  meio_ambiente: { rotulo: 'Meio ambiente', Icone: Leaf, tom: 'verde' },
}

const SERVICO_PADRAO = { rotulo: 'Serviço', Icone: Wrench, tom: 'azul' }

export function visualServico(servico) {
  const id = typeof servico === 'string' ? servico : servico?.id
  const base = SERVICOS_VISUAL[id] ?? SERVICO_PADRAO
  if (!servico || typeof servico === 'string') return base
  return {
    ...base,
    Icone: iconeVisual(servico.icone) ?? base.Icone,
    tom: tomVisual(servico.cor) ?? base.tom,
  }
}

const AVISOS_VISUAL = {
  Saúde: { Icone: HeartPulse, tom: 'coral' },
  Serviço: { Icone: Wrench, tom: 'azul' },
  Zeladoria: { Icone: Trash2, tom: 'verde' },
}

const AVISO_PADRAO = { Icone: Megaphone, tom: 'ambar' }

export function visualAviso(aviso) {
  const categoria = typeof aviso === 'string' ? aviso : aviso?.categoria
  const base = AVISOS_VISUAL[categoria] ?? AVISO_PADRAO
  if (!aviso || typeof aviso === 'string') return base
  return {
    ...base,
    Icone: iconeVisual(aviso.icone) ?? base.Icone,
    tom: tomVisual(aviso.cor) ?? base.tom,
  }
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
