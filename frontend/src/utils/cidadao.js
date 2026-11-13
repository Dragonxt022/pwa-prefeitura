import { formatarCep } from './solicitacao'

export function formatarTelefone(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '')
  if (digitos.length !== 10 && digitos.length !== 11) return digitos
  const ddd = digitos.slice(0, 2)
  const resto = digitos.slice(2)
  const corte = resto.length === 9 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

export function comporEndereco(cidadao) {
  if (!cidadao) return ''
  const rua = [cidadao.logradouro, cidadao.numero].filter(Boolean).join(', ')
  const complemento = cidadao.complemento ? ` - ${cidadao.complemento}` : ''
  const bairro = cidadao.bairro ? ` - ${cidadao.bairro}` : ''
  return `${rua}${complemento}${bairro}`.trim()
}

export function enderecoCompleto(cidadao) {
  if (!cidadao) return ''
  return [
    comporEndereco(cidadao),
    cidadao.cidade && cidadao.uf ? `${cidadao.cidade}/${cidadao.uf}` : cidadao.cidade,
    cidadao.cep ? `CEP ${formatarCep(cidadao.cep)}` : '',
  ].filter(Boolean).join(' · ')
}

export function resumoPerfil(cidadao) {
  if (!cidadao) return ''
  return [formatarTelefone(cidadao.telefone), enderecoCompleto(cidadao)]
    .filter(Boolean)
    .join(' — ')
}
