export const LIMITES = {
  descricaoMin: 10,
  descricaoMax: 1200,
  enderecoMin: 5,
  enderecoMax: 200,
  contatoMax: 120,
}

export const FORMULARIO_VAZIO = {
  tipo: '',
  descricao: '',
  endereco: '',
  contato: '',
  cep: '',
  localizacao: null,
  foto: null,
}

export const normalizar = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export function formatarCep(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 8)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

export function novoClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `pedido-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function temConteudo(formulario) {
  return Object.entries(formulario).some(([campo, valor]) => {
    if (campo === 'localizacao') return Boolean(valor)
    if (campo === 'foto') return Boolean(valor)
    return String(valor ?? '').trim().length > 0
  })
}

export function validarFormulario(formulario) {
  const proximos = {}
  const descricao = formulario.descricao.trim()
  const endereco = formulario.endereco.trim()

  if (!formulario.tipo) proximos.tipo = 'Escolha um serviço.'
  if (descricao.length < LIMITES.descricaoMin) {
    proximos.descricao = `Mínimo de ${LIMITES.descricaoMin} caracteres.`
  } else if (descricao.length > LIMITES.descricaoMax) {
    proximos.descricao = `Máximo de ${LIMITES.descricaoMax} caracteres.`
  }
  if (endereco.length < LIMITES.enderecoMin) {
    proximos.endereco = 'Informe o endereço com um ponto de referência.'
  } else if (endereco.length > LIMITES.enderecoMax) {
    proximos.endereco = `Máximo de ${LIMITES.enderecoMax} caracteres.`
  }
  if (formulario.contato.trim().length > LIMITES.contatoMax) {
    proximos.contato = `Máximo de ${LIMITES.contatoMax} caracteres.`
  }

  return proximos
}
