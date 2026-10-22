/**
 * Erro de aplicacao com status HTTP e codigo estavel.
 * O formato devolvido ao cliente e sempre:
 *   { erro: { codigo, mensagem, campos? } }
 */
export class AppError extends Error {
  constructor(status, codigo, mensagem, campos) {
    super(mensagem)
    this.name = 'AppError'
    this.status = status
    this.codigo = codigo
    this.campos = campos
  }
}

export const naoEncontrado = (mensagem) =>
  new AppError(404, 'nao_encontrado', mensagem)

export const naoImplementado = (mensagem) =>
  new AppError(501, 'nao_implementado', mensagem)

export const validacao = (campos, mensagem = 'Dados invalidos.') =>
  new AppError(422, 'validacao', mensagem, campos)
