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
 * Secretarias oficiais informadas pelo município em 13/11/2026.
 *
 * Esta é a semente do cadastro administrativo. O `id` é curto e estável; o
 * `slug` preserva o identificador externo usado no cadastro do município.
 * A criação/edição pelo painel será adicionada em uma etapa própria.
 */
export const secretarias = [
  {
    id: 'comunicacao',
    sigla: 'GABINETE',
    nome: 'Comunicação (Gabinete)',
    slug: 'comunicacao-gabinete',
    ativo: true,
  },
  {
    id: 'testes',
    sigla: 'TESTES',
    nome: 'Secretaria - Testes',
    slug: 'secretaria-testes',
    ativo: true,
    teste: true,
  },
  {
    id: 'sema',
    sigla: 'SEMA',
    nome: 'Secretaria Municipal de Meio Ambiente',
    slug: 'sema-secretaria-municipal-de-meio-ambiente',
    ativo: true,
  },
  {
    id: 'semagri',
    sigla: 'SEMAGRI',
    nome: 'Secretaria Municipal de Agricultura',
    slug: 'semagri-secretaria-municipal-de-agricultura',
    ativo: true,
  },
  {
    id: 'semas',
    sigla: 'SEMAS',
    nome: 'Secretaria do Município de Assistência Social',
    slug: 'semas-secretaria-do-municipio-de-assist-social',
    ativo: true,
  },
  {
    id: 'semecd',
    sigla: 'SEMECD',
    nome: 'Secretaria do Município de Educação',
    slug: 'semecd-secretaria-do-municipio-de-educacao',
    ativo: true,
  },
  {
    id: 'semel',
    sigla: 'SEMEL',
    nome: 'Secretaria Municipal de Esportes',
    slug: 'semel-secretaria-municipal-de-esportes',
    ativo: true,
  },
  {
    id: 'semiu',
    sigla: 'SEMIU',
    nome: 'Secretaria Municipal de Infraestrutura e Urbanismo',
    slug: 'semiu-secretaria-municipal-de-infraestrutura-e-urbanismo',
    ativo: true,
  },
  {
    id: 'semosp',
    sigla: 'SEMOSP',
    nome: 'Secretaria Municipal de Obras',
    slug: 'semosp-secretaria-municipal-de-obras',
    ativo: true,
  },
  {
    id: 'semsau',
    sigla: 'SEMSAU',
    nome: 'Secretaria Municipal de Saúde',
    slug: 'semsau-secretaria-municipal-de-saude',
    ativo: true,
  },
  {
    id: 'seplan',
    sigla: 'SEPLAN',
    nome: 'Secretaria de Planejamento',
    slug: 'seplan-secretaria-de-planejamento',
    ativo: true,
  },
]

/**
 * Setores operacionais do piloto.
 *
 * `secretariaId` liga o setor à secretaria oficial quando o vínculo já está
 * definido. Setores com `null` ainda dependem de confirmação do município.
 * A triagem central nunca deixa de ver tudo.
 */
export const setores = [
  {
    id: 'triagem',
    nome: 'Triagem e Protocolo',
    secretaria: 'Comunicação e Atendimento',
    secretariaId: 'comunicacao',
    descricao: 'Recebe, classifica e encaminha as solicitações para os setores.',
    servicos: [],
    central: true,
    ativo: true,
  },
  {
    id: 'infraestrutura',
    nome: 'Obras e Infraestrutura',
    secretaria: 'Secretaria de Obras',
    secretariaId: 'semosp',
    descricao: 'Iluminação pública e pavimentação.',
    servicos: ['iluminacao', 'pavimentacao'],
    central: false,
    ativo: true,
  },
  {
    id: 'zeladoria',
    nome: 'Zeladoria e Serviços Urbanos',
    secretaria: 'Secretaria de Serviços Urbanos',
    secretariaId: null,
    descricao: 'Limpeza, coleta e conservação da cidade.',
    servicos: ['limpeza', 'zeladoria'],
    central: false,
    ativo: true,
  },
  {
    id: 'meio_ambiente',
    nome: 'Meio Ambiente',
    secretaria: 'Secretaria de Meio Ambiente',
    secretariaId: 'sema',
    descricao: 'Poda, arborização e proteção ambiental.',
    servicos: ['poda', 'meio_ambiente'],
    central: false,
    ativo: true,
  },
  {
    id: 'fiscalizacao',
    nome: 'Fiscalização e Posturas',
    secretaria: 'Secretaria de Fiscalização',
    secretariaId: null,
    descricao: 'Terrenos, construções e posturas municipais.',
    servicos: ['fiscalizacao'],
    central: false,
    ativo: true,
  },
  {
    id: 'mobilidade',
    nome: 'Mobilidade e Trânsito',
    secretaria: 'Secretaria de Mobilidade',
    secretariaId: null,
    descricao: 'Sinalização, trânsito e acessibilidade viária.',
    servicos: ['sinalizacao'],
    central: false,
    ativo: true,
  },
  {
    id: 'ouvidoria',
    nome: 'Ouvidoria',
    secretaria: 'Controladoria / Ouvidoria',
    secretariaId: null,
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

export function listarSecretarias({ incluirInativos = false } = {}) {
  return secretarias
    .filter((secretaria) => incluirInativos || secretaria.ativo)
    .map((secretaria) => ({ ...secretaria }))
}

export function buscarSecretaria(id) {
  return secretarias.find((secretaria) => secretaria.id === id) ?? null
}

export function secretariaDoSetor(setorId) {
  const setor = buscarSetor(setorId)
  return setor?.secretariaId ? buscarSecretaria(setor.secretariaId) : null
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
    secretariaId: setor.secretariaId ?? null,
    central: Boolean(setor.central),
  }
}

export function setorDoServico(tipo) {
  return setores.find(
    (setor) => !setor.central && Array.isArray(setor.servicos) && setor.servicos.includes(tipo),
  ) ?? setores.find((setor) => setor.central)
}
