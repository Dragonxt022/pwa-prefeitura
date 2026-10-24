/** Normalizações e conversões de entrada usadas pelas camadas HTTP e de domínio. */

export function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function booleano(valor, padrao = false) {
  if (valor === undefined) return padrao
  return valor === true || valor === 1 || ['1', 'true', 'sim', 'on'].includes(String(valor).toLowerCase())
}

export function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function normalizarEmail(valor) {
  return String(valor ?? '').trim().toLowerCase()
}

export function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor ?? '').trim())
}
