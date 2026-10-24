import { infoStatus } from './format'

export const STATUS_OPCOES = ['recebida', 'em_analise', 'em_execucao', 'concluida', 'indeferida']

export const PRIORIDADES = [
  { valor: 'normal', rotulo: 'Normal' },
  { valor: 'alta', rotulo: 'Alta' },
  { valor: 'baixa', rotulo: 'Baixa' },
]

export const PAPEIS_UI = {
  admin: 'Administrador geral',
  triagem: 'Triagem / Protocolo',
  setor: 'Setor',
}

export const FILTROS_INICIAIS = { status: '', tipo: '', busca: '', setor: '' }

export const FORM_USUARIO_INICIAL = {
  nome: '',
  email: '',
  senha: '',
  papel: 'setor',
  setorId: '',
}

export function urlDoMapa(localizacao) {
  return `https://www.openstreetmap.org/?mlat=${localizacao.latitude}&mlon=${localizacao.longitude}#map=18/${localizacao.latitude}/${localizacao.longitude}`
}

export function descreverFiltros(filtros, servicos, setores) {
  const partes = []
  if (filtros.busca) partes.push(`Busca: ${filtros.busca}`)
  if (filtros.status) partes.push(`Status: ${infoStatus(filtros.status).rotulo}`)
  if (filtros.tipo) {
    partes.push(
      `Serviço: ${servicos.find((servico) => servico.id === filtros.tipo)?.titulo ?? filtros.tipo}`,
    )
  }
  if (filtros.setor) {
    partes.push(
      `Setor: ${setores.find((setor) => setor.id === filtros.setor)?.nome ?? filtros.setor}`,
    )
  }
  return partes.length > 0 ? partes.join(' · ') : 'Todos os registros da fila'
}
