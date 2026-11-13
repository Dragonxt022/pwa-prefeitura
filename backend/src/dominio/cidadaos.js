/**
 * Dados do cidadão.
 *
 * O cadastro coleta apenas o necessário para abrir e acompanhar solicitações:
 * identificação, contato e endereço. Não há CPF, documento ou dados sensíveis.
 * A senha é guardada somente como hash scrypt.
 */
import { gerarHashSenha } from '../utils/seguranca.js'
import { normalizarEmail } from '../utils/texto.js'

export const VERSAO_PRIVACIDADE = '2026-11-13'

export function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

export function normalizarTelefone(valor) {
  const digitos = somenteDigitos(valor)
  if (digitos.length >= 12 && digitos.startsWith('55')) return digitos.slice(2, 13)
  return digitos.slice(0, 11)
}

export function normalizarCep(valor) {
  return somenteDigitos(valor).slice(0, 8)
}

export function formatarTelefone(valor) {
  const digitos = normalizarTelefone(valor)
  if (digitos.length !== 10 && digitos.length !== 11) return digitos
  const ddd = digitos.slice(0, 2)
  const resto = digitos.slice(2)
  const corte = resto.length === 9 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

export function formatarCep(valor) {
  const digitos = normalizarCep(valor)
  return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

/** Endereço em uma linha, no formato aceito pelo campo da solicitação. */
export function comporEndereco(cidadao) {
  if (!cidadao) return ''
  const rua = [cidadao.logradouro, cidadao.numero].filter(Boolean).join(', ')
  const complemento = cidadao.complemento ? ` - ${cidadao.complemento}` : ''
  const bairro = cidadao.bairro ? ` - ${cidadao.bairro}` : ''
  return `${rua}${complemento}${bairro}`.trim()
}

export function normalizarCidadao(item = {}) {
  const criadoEm = item.criadoEm || new Date().toISOString()
  return {
    id: String(item.id ?? ''),
    nome: String(item.nome ?? '').trim(),
    email: normalizarEmail(item.email),
    senhaHash: item.senhaHash || (item.senha ? gerarHashSenha(item.senha) : null),
    telefone: normalizarTelefone(item.telefone),
    cep: normalizarCep(item.cep),
    logradouro: String(item.logradouro ?? '').trim(),
    numero: String(item.numero ?? '').trim(),
    complemento: String(item.complemento ?? '').trim() || null,
    bairro: String(item.bairro ?? '').trim(),
    cidade: String(item.cidade ?? '').trim(),
    uf: String(item.uf ?? '').trim().toUpperCase().slice(0, 2),
    ativo: item.ativo !== false,
    consentimentoEm: item.consentimentoEm || null,
    consentimentoVersao: item.consentimentoVersao || null,
    removidoEm: item.removidoEm || null,
    criadoEm,
    atualizadoEm: item.atualizadoEm || criadoEm,
  }
}
