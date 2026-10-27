/**
 * Código de acesso do cidadão ao próprio protocolo.
 *
 * O código tem 12 caracteres de um alfabeto de 32 símbolos (60 bits), é gerado
 * no navegador e nunca é enviado na URL. O backend guarda apenas o hash. O
 * alfabeto exclui I, O, 0 e 1 para reduzir erros de digitação.
 */
export const CODIGO_ACESSO_ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODIGO_ACESSO_TAMANHO = 12

const PADRAO_CODIGO = new RegExp(`^[${CODIGO_ACESSO_ALFABETO}]{${CODIGO_ACESSO_TAMANHO}}$`)

function limparCodigo(valor) {
  return String(valor ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODIGO_ACESSO_TAMANHO)
}

/** Formata progressivamente no padrão ABCD-EFGH-JKLM. */
export function normalizarCodigoAcesso(valor) {
  const limpo = limparCodigo(valor)
  if (limpo.length <= 4) return limpo
  if (limpo.length <= 8) return `${limpo.slice(0, 4)}-${limpo.slice(4)}`
  return `${limpo.slice(0, 4)}-${limpo.slice(4, 8)}-${limpo.slice(8)}`
}

/** Valida o código após remover espaços e separadores. */
export function codigoAcessoValido(valor) {
  return PADRAO_CODIGO.test(limparCodigo(valor))
}

/**
 * Gera o código com Web Crypto. A máscara 31 é uniforme porque o alfabeto tem
 * exatamente 32 símbolos.
 */
export function gerarCodigoAcesso() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Não foi possível gerar o código de acesso com segurança neste navegador.')
  }
  const bytes = new Uint8Array(CODIGO_ACESSO_TAMANHO)
  globalThis.crypto.getRandomValues(bytes)
  let limpo = ''
  for (const byte of bytes) limpo += CODIGO_ACESSO_ALFABETO[byte & 31]
  return normalizarCodigoAcesso(limpo)
}
