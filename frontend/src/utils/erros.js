/**
 * Acesso centralizado ao catálogo de erros no frontend.
 *
 * O código é o contrato estável. Use `codigo` para decisões de fluxo e
 * `mensagemDoErro` apenas para texto de fallback; a mensagem vinda da API pode
 * ser mais específica.
 */
import {
  CATALOGO_ERROS,
  CODIGOS_ERRO,
  definicaoErro,
  mensagemDoErro,
} from '../../../shared/codigos-erro.js'

export { CATALOGO_ERROS, CODIGOS_ERRO, definicaoErro, mensagemDoErro }

export function codigoDoErro(erro) {
  return erro?.codigo || CODIGOS_ERRO.DESCONHECIDO
}

export function tituloDoErro(erro, fallback = 'Não foi possível carregar') {
  const codigo = typeof erro === 'string' ? erro : erro?.codigo
  if (!codigo || !CATALOGO_ERROS[codigo]) return fallback
  return CATALOGO_ERROS[codigo].titulo
}

export function mensagemAmigavel(erro, fallback) {
  if (erro?.message) return erro.message
  if (typeof erro === 'string' && erro) return mensagemDoErro(erro)
  return fallback || mensagemDoErro(CODIGOS_ERRO.DESCONHECIDO)
}

export function ehErroDe(erro, codigo) {
  return codigoDoErro(erro) === codigo
}
