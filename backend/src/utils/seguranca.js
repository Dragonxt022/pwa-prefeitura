import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const TAMANHO_HASH = 64
const PREFIXO_HASH = 'scrypt'

/** Hash de senha com sal aleatório e scrypt nativo do Node. */
export function gerarHashSenha(senha) {
  const sal = randomBytes(16).toString('hex')
  const hash = scryptSync(String(senha), sal, TAMANHO_HASH).toString('hex')
  return `${PREFIXO_HASH}$${sal}$${hash}`
}

/** Compara a senha em tempo constante sempre que o hash é válido. */
export function verificarSenha(senha, hashArmazenado) {
  try {
    const [prefixo, sal, hash] = String(hashArmazenado ?? '').split('$')
    if (prefixo !== PREFIXO_HASH || !sal || !hash) return false
    const calculado = scryptSync(String(senha), sal, TAMANHO_HASH)
    const esperado = Buffer.from(hash, 'hex')
    return calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
  } catch {
    return false
  }
}

/** O token opaco só é entregue ao navegador; no JSON fica apenas o hash. */
export function gerarTokenSessao() {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex')
}

/** Confere um token opaco contra o hash SHA-256 salvo, em tempo constante. */
export function verificarHashToken(token, hashArmazenado) {
  const esperado = String(hashArmazenado ?? '')
  if (!/^[a-f0-9]{64}$/i.test(esperado)) return false
  const calculado = Buffer.from(hashToken(token), 'hex')
  return timingSafeEqual(calculado, Buffer.from(esperado, 'hex'))
}
