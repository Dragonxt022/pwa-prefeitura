/** Dados iniciais usados somente quando o arquivo local ainda não existe. */

export const SOLICITACOES_SEMENTE = [
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

export const SENHA_DEMO = process.env.DEMO_PASSWORD || 'prefeitura-demo'

export const USUARIOS_SEMENTE = [
  {
    id: 'usuario-admin',
    nome: 'Administrador Geral',
    email: 'admin@prefeitura.demo',
    papel: 'admin',
    setorId: null,
  },
  {
    id: 'usuario-triagem',
    nome: 'Equipe de Triagem',
    email: 'triagem@prefeitura.demo',
    papel: 'triagem',
    setorId: 'triagem',
  },
  {
    id: 'usuario-obras',
    nome: 'Equipe de Obras',
    email: 'obras@prefeitura.demo',
    papel: 'setor',
    setorId: 'infraestrutura',
  },
  {
    id: 'usuario-zeladoria',
    nome: 'Equipe de Zeladoria',
    email: 'zeladoria@prefeitura.demo',
    papel: 'setor',
    setorId: 'zeladoria',
  },
  {
    id: 'usuario-meio-ambiente',
    nome: 'Equipe de Meio Ambiente',
    email: 'ambiente@prefeitura.demo',
    papel: 'setor',
    setorId: 'meio_ambiente',
  },
  {
    id: 'usuario-fiscalizacao',
    nome: 'Equipe de Fiscalização',
    email: 'fiscalizacao@prefeitura.demo',
    papel: 'setor',
    setorId: 'fiscalizacao',
  },
  {
    id: 'usuario-mobilidade',
    nome: 'Equipe de Mobilidade',
    email: 'mobilidade@prefeitura.demo',
    papel: 'setor',
    setorId: 'mobilidade',
  },
  {
    id: 'usuario-ouvidoria',
    nome: 'Equipe de Ouvidoria',
    email: 'ouvidoria@prefeitura.demo',
    papel: 'setor',
    setorId: 'ouvidoria',
  },
]
