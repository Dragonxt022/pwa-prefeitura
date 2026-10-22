/**
 * Store em memória do piloto.
 *
 * Limitações conhecidas (ver doc/adr/0003-dados-em-memoria.md):
 * - os dados são perdidos a cada reinício do processo;
 * - não há concorrência real, transação ou idempotência;
 * - não usar com dados pessoais reais.
 */

export const STATUS = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  indeferida: 'Indeferida',
}

export const STATUS_ABERTOS = ['recebida', 'em_analise', 'em_execucao']

export const servicos = [
  {
    id: 'iluminacao',
    titulo: 'Iluminação pública',
    descricao: 'Poste apagado, lâmpada queimada, luminária danificada ou fiação exposta.',
    categoria: 'Infraestrutura',
    prazoDias: 5,
  },
  {
    id: 'pavimentacao',
    titulo: 'Buracos e pavimentação',
    descricao: 'Buraco na via, afundamento de asfalto, calçada quebrada ou meio-fio danificado.',
    categoria: 'Infraestrutura',
    prazoDias: 15,
  },
  {
    id: 'limpeza',
    titulo: 'Coleta de lixo e limpeza',
    descricao: 'Lixo acumulado, entulho em via pública, poda de mato ou limpeza de bueiro.',
    categoria: 'Zeladoria',
    prazoDias: 3,
  },
  {
    id: 'poda',
    titulo: 'Poda de árvores',
    descricao: 'Galhos sobre a rede elétrica, árvore com risco de queda ou poda de rotina.',
    categoria: 'Meio ambiente',
    prazoDias: 10,
  },
  {
    id: 'fiscalizacao',
    titulo: 'Fiscalização de terrenos',
    descricao: 'Terreno abandonado, mato alto, descarte irregular ou construção irregular.',
    categoria: 'Fiscalização',
    prazoDias: 20,
  },
  {
    id: 'sinalizacao',
    titulo: 'Sinalização de trânsito',
    descricao: 'Placa danificada, faixa apagada, semáforo com defeito ou falta de sinalização.',
    categoria: 'Mobilidade',
    prazoDias: 7,
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

let sequencia = 3

/** @type {Array<object>} */
export const solicitacoes = [
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

export function listarServicos() {
  return servicos
}

export function buscarServico(id) {
  return servicos.find((servico) => servico.id === id)
}

export function listarAvisos() {
  return [...avisos].sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm))
}

export function buscarSolicitacao(protocolo) {
  return solicitacoes.find((item) => item.protocolo === protocolo.toUpperCase().trim())
}

export function criarSolicitacao({ tipo, descricao, endereco, contato }) {
  const agora = new Date().toISOString()
  const servico = buscarServico(tipo)
  sequencia += 1

  const solicitacao = {
    protocolo: `PREF-${new Date().getFullYear()}-${String(sequencia).padStart(6, '0')}`,
    tipo,
    tipoTitulo: servico.titulo,
    descricao: descricao.trim(),
    endereco: endereco.trim(),
    contato: contato?.trim() || null,
    status: 'recebida',
    criadoEm: agora,
    atualizadoEm: agora,
    historico: [
      { status: 'recebida', em: agora, observacao: 'Solicitação registrada pelo aplicativo.' },
    ],
  }

  solicitacoes.unshift(solicitacao)
  return solicitacao
}

export function reiniciar() {
  sequencia = 3
}
