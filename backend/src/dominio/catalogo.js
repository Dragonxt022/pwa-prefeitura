/**
 * Catálogo estático do piloto.
 *
 * Serviços, setores, avisos e perfil não são mutáveis em tempo de execução. A
 * lista oficial de secretarias ainda depende de confirmação do município.
 */

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
 * ajuste os nomes/serviços aqui quando o município confirmar a estrutura. A
 * triagem central nunca deixa de ver tudo.
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

export function setorDoServico(tipo) {
  return setores.find(
    (setor) => !setor.central && Array.isArray(setor.servicos) && setor.servicos.includes(tipo),
  ) ?? setores.find((setor) => setor.central)
}
