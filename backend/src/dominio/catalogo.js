/**
 * Catálogo de serviços, setores e secretarias.
 *
 * As listas `...Semente` são a carga inicial do banco. Em execução, as funções
 * de leitura usam um cache sincronizado pelo repositório do catálogo, mantendo
 * os contratos síncronos consumidos pela triagem e pelos apresentadores.
 *
 * A hierarquia é Secretaria -> Setor -> Serviço. O vínculo autoritativo do
 * serviço é `servico.setorId`; a lista `setor.servicos` é derivada no cache.
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
 * A secretaria de testes nasce desativada (soft delete) e permanece apenas
 * para rastreabilidade; não aparece nas listas públicas.
 */
export const secretariasSemente = [
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
    ativo: false,
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
 * `secretariaId` liga o setor à secretaria oficial. Todos os setores do piloto
 * já têm vínculo definido; novos setores ainda podem ser criados sem secretaria
 * pela tela administrativa. A triagem central nunca deixa de ver tudo.
 */
export const setoresSemente = [
  {
    id: 'triagem',
    nome: 'Triagem e Protocolo',
    secretaria: 'Comunicação e Atendimento',
    secretariaId: 'comunicacao',
    descricao: 'Recebe, classifica e encaminha as solicitações para os setores.',
    central: true,
    ativo: true,
  },
  {
    id: 'infraestrutura',
    nome: 'Obras e Infraestrutura',
    secretaria: 'Secretaria de Obras',
    secretariaId: 'semosp',
    descricao: 'Iluminação pública e pavimentação.',
    central: false,
    ativo: true,
  },
  {
    id: 'zeladoria',
    nome: 'Zeladoria e Serviços Urbanos',
    secretaria: 'Secretaria Municipal de Obras',
    secretariaId: 'semosp',
    descricao: 'Limpeza, coleta e conservação da cidade.',
    central: false,
    ativo: true,
  },
  {
    id: 'meio_ambiente',
    nome: 'Meio Ambiente',
    secretaria: 'Secretaria de Meio Ambiente',
    secretariaId: 'sema',
    descricao: 'Poda, arborização e proteção ambiental.',
    central: false,
    ativo: true,
  },
  {
    id: 'fiscalizacao',
    nome: 'Fiscalização e Posturas',
    secretaria: 'Secretaria Municipal de Infraestrutura e Urbanismo',
    secretariaId: 'semiu',
    descricao: 'Terrenos, construções e posturas municipais.',
    central: false,
    ativo: true,
  },
  {
    id: 'mobilidade',
    nome: 'Mobilidade e Trânsito',
    secretaria: 'Secretaria Municipal de Infraestrutura e Urbanismo',
    secretariaId: 'semiu',
    descricao: 'Sinalização, trânsito e acessibilidade viária.',
    central: false,
    ativo: true,
  },
]

export const servicosSemente = [
  {
    id: 'iluminacao',
    titulo: 'Iluminação pública',
    descricao: 'Poste apagado, lâmpada queimada, luminária danificada ou fiação exposta.',
    categoria: 'Infraestrutura',
    prazoDias: 5,
    ordem: 1,
    destaque: true,
    setorId: 'infraestrutura',
  },
  {
    id: 'pavimentacao',
    titulo: 'Buracos e pavimentação',
    descricao: 'Buraco na via, afundamento de asfalto, calçada quebrada ou meio-fio danificado.',
    categoria: 'Infraestrutura',
    prazoDias: 15,
    ordem: 2,
    destaque: true,
    setorId: 'infraestrutura',
  },
  {
    id: 'limpeza',
    titulo: 'Coleta de lixo e limpeza',
    descricao: 'Lixo acumulado, entulho em via pública, poda de mato ou limpeza de bueiro.',
    categoria: 'Zeladoria',
    prazoDias: 3,
    ordem: 3,
    destaque: true,
    setorId: 'zeladoria',
  },
  {
    id: 'poda',
    titulo: 'Poda de árvores',
    descricao: 'Galhos sobre a rede elétrica, árvore com risco de queda ou poda de rotina.',
    categoria: 'Meio ambiente',
    prazoDias: 10,
    ordem: 4,
    destaque: true,
    setorId: 'meio_ambiente',
  },
  {
    id: 'fiscalizacao',
    titulo: 'Fiscalização de terrenos',
    descricao: 'Terreno abandonado, mato alto, descarte irregular ou construção irregular.',
    categoria: 'Fiscalização',
    prazoDias: 20,
    ordem: 5,
    destaque: true,
    setorId: 'fiscalizacao',
  },
  {
    id: 'sinalizacao',
    titulo: 'Sinalização de trânsito',
    descricao: 'Placa danificada, faixa apagada, semáforo com defeito ou falta de sinalização.',
    categoria: 'Mobilidade',
    prazoDias: 7,
    ordem: 6,
    destaque: true,
    setorId: 'mobilidade',
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
    setorId: 'zeladoria',
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
    setorId: 'meio_ambiente',
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

function clonar(valor) {
  return valor ? structuredClone(valor) : valor
}

const cache = {
  secretarias: [],
  setores: [],
  servicos: [],
}

/**
 * Substitui o cache em memória pelo catálogo carregado do repositório.
 * Setores recebem a lista de serviços derivada de `servico.setorId`.
 */
export function aplicarCatalogo({ secretarias = [], setores = [], servicos = [] } = {}) {
  const secretariasNormalizadas = secretarias.map((secretaria) => ({
    ...secretaria,
    ativo: secretaria.ativo !== false,
    teste: Boolean(secretaria.teste),
  }))
  const nomesSecretarias = new Map(
    secretariasNormalizadas.map((secretaria) => [secretaria.id, secretaria.nome]),
  )
  const servicosNormalizados = servicos.map((servico) => ({
    ...servico,
    ativo: servico.ativo !== false,
    destaque: Boolean(servico.destaque),
    novo: Boolean(servico.novo),
    setorId: servico.setorId ?? null,
  }))
  const setoresNormalizados = setores.map((setor) => ({
    ...setor,
    central: Boolean(setor.central),
    ativo: setor.ativo !== false,
    secretariaId: setor.secretariaId ?? null,
    secretaria: setor.secretariaId
      ? (nomesSecretarias.get(setor.secretariaId) ?? setor.secretaria ?? 'Sem secretaria')
      : (setor.secretaria ?? 'Sem secretaria'),
    servicos: servicosNormalizados
      .filter((servico) => servico.setorId === setor.id)
      .map((servico) => servico.id),
  }))

  cache.secretarias = secretariasNormalizadas
  cache.setores = setoresNormalizados
  cache.servicos = servicosNormalizados
}

/** Cópia do catálogo efetivamente em uso, útil para repositórios e testes. */
export function catalogoAtual() {
  return {
    secretarias: clonar(cache.secretarias),
    setores: clonar(cache.setores),
    servicos: clonar(cache.servicos),
  }
}

aplicarCatalogo({
  secretarias: secretariasSemente,
  setores: setoresSemente,
  servicos: servicosSemente,
})

export function listarServicos({ incluirInativos = false } = {}) {
  return cache.servicos
    .filter((servico) => incluirInativos || servico.ativo)
    .sort((a, b) => a.ordem - b.ordem)
    .map((servico) => ({ ...servico }))
}

export function buscarServico(id, { incluirInativos = false } = {}) {
  return clonar(
    cache.servicos.find(
      (servico) => servico.id === id && (incluirInativos || servico.ativo),
    ),
  ) ?? null
}

export function listarAvisos() {
  return [...avisos].sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm))
}

export function listarSetores({ incluirInativos = false } = {}) {
  return cache.setores
    .filter((setor) => incluirInativos || setor.ativo)
    .map((setor) => ({ ...setor, servicos: [...setor.servicos] }))
}

export function listarSecretarias({ incluirInativos = false } = {}) {
  return cache.secretarias
    .filter((secretaria) => incluirInativos || secretaria.ativo)
    .map((secretaria) => ({ ...secretaria }))
}

export function buscarSecretaria(id, { incluirInativos = true } = {}) {
  return clonar(
    cache.secretarias.find(
      (secretaria) => secretaria.id === id && (incluirInativos || secretaria.ativo),
    ),
  ) ?? null
}

export function secretariaDoSetor(setorId) {
  const setor = buscarSetor(setorId)
  if (!setor?.secretariaId) return null
  return buscarSecretaria(setor.secretariaId)
}

export function buscarSetor(id, { incluirInativos = true } = {}) {
  return clonar(
    cache.setores.find(
      (setor) => setor.id === id && (incluirInativos || setor.ativo),
    ),
  ) ?? null
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
  return cache.setores.find(
    (setor) =>
      setor.ativo &&
      !setor.central &&
      Array.isArray(setor.servicos) &&
      setor.servicos.includes(tipo),
  ) ?? cache.setores.find((setor) => setor.ativo && setor.central) ?? null
}

export function servicosDoSetor(setorId) {
  return cache.servicos
    .filter((servico) => servico.setorId === setorId)
    .sort((a, b) => a.ordem - b.ordem)
    .map((servico) => ({ ...servico }))
}
