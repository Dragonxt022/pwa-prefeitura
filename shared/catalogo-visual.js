/**
 * Catálogo visual compartilhado entre frontend e backend.
 *
 * Os identificadores são estáveis e usados na persistência. O frontend traduz
 * cada identificador para um componente de ícone e para um tom do tema; o
 * backend usa a mesma lista para validar o que o painel envia.
 */

export const TONS_VISUAIS = [
  { id: 'azul', rotulo: 'Azul' },
  { id: 'verde', rotulo: 'Verde' },
  { id: 'teal', rotulo: 'Turquesa' },
  { id: 'ambar', rotulo: 'Âmbar' },
  { id: 'coral', rotulo: 'Coral' },
  { id: 'roxo', rotulo: 'Roxo' },
]

export const ICONES_VISUAIS = [
  { id: 'lightbulb', rotulo: 'Iluminação' },
  { id: 'construction', rotulo: 'Obras' },
  { id: 'trash-2', rotulo: 'Limpeza' },
  { id: 'tree-pine', rotulo: 'Poda e árvores' },
  { id: 'fence', rotulo: 'Fiscalização' },
  { id: 'signpost', rotulo: 'Sinalização' },
  { id: 'building-2', rotulo: 'Zeladoria' },
  { id: 'leaf', rotulo: 'Meio ambiente' },
  { id: 'wrench', rotulo: 'Serviço' },
  { id: 'droplets', rotulo: 'Água e esgoto' },
  { id: 'bus', rotulo: 'Transporte' },
  { id: 'school', rotulo: 'Educação' },
  { id: 'heart-pulse', rotulo: 'Saúde' },
  { id: 'stethoscope', rotulo: 'Atendimento' },
  { id: 'paw-print', rotulo: 'Animais' },
  { id: 'shield-check', rotulo: 'Segurança' },
  { id: 'traffic-cone', rotulo: 'Trânsito' },
  { id: 'brush-cleaning', rotulo: 'Conservação' },
  { id: 'megaphone', rotulo: 'Comunicado' },
  { id: 'info', rotulo: 'Informação' },
  { id: 'triangle-alert', rotulo: 'Alerta' },
  { id: 'calendar-days', rotulo: 'Evento' },
  { id: 'map-pin', rotulo: 'Localização' },
  { id: 'users', rotulo: 'Comunidade' },
  { id: 'recycle', rotulo: 'Reciclagem' },
  { id: 'zap', rotulo: 'Energia' },
  { id: 'road', rotulo: 'Vias' },
  { id: 'hospital', rotulo: 'Hospital' },
  { id: 'flower-2', rotulo: 'Praças' },
  { id: 'utensils', rotulo: 'Alimentação' },
  { id: 'briefcase', rotulo: 'Serviços públicos' },
  { id: 'book-open', rotulo: 'Cultura' },
  { id: 'accessibility', rotulo: 'Acessibilidade' },
  { id: 'baby', rotulo: 'Infância' },
  { id: 'dog', rotulo: 'Cuidado animal' },
  { id: 'hammer', rotulo: 'Manutenção' },
]

export const IDS_TONS = TONS_VISUAIS.map((tom) => tom.id)
export const IDS_ICONES = ICONES_VISUAIS.map((icone) => icone.id)

export function tomVisualValido(valor) {
  return IDS_TONS.includes(valor)
}

export function iconeVisualValido(valor) {
  return IDS_ICONES.includes(valor)
}
