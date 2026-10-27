/**
 * Erro de aplicação com status HTTP e código estável.
 *
 * O catálogo compartilhado em `shared/codigos-erro.js` é a fonte única para
 * status, mensagem padrão e título amigável. O formato devolvido ao cliente é:
 *   { erro: { codigo, mensagem, campos? } }
 */
import {
  CATALOGO_ERROS,
  CODIGOS_ERRO,
  corpoErro,
  definicaoErro,
  statusDoErro,
} from '../../../shared/codigos-erro.js'

export class AppError extends Error {
  constructor(codigo, { mensagem, campos, status } = {}) {
    const definicao = definicaoErro(codigo)
    const texto = mensagem || definicao.mensagem
    super(texto)
    this.name = 'AppError'
    this.codigo = CATALOGO_ERROS[codigo] ? codigo : CODIGOS_ERRO.DESCONHECIDO
    this.status = status ?? statusDoErro(this.codigo)
    this.mensagem = texto
    this.campos = campos
  }
}

export const erro = (codigo, opcoes) => new AppError(codigo, opcoes)

export const naoEncontrado = (mensagem) =>
  new AppError(CODIGOS_ERRO.NAO_ENCONTRADO, { mensagem })

/**
 * Resposta genérica para protocolo inexistente ou código incorreto. O mesmo
 * código/status evita confirmar a existência de um protocolo a terceiros.
 */
export const codigoAcessoInvalido = () =>
  new AppError(CODIGOS_ERRO.CODIGO_ACESSO_INVALIDO)

export const naoImplementado = (mensagem) =>
  new AppError(CODIGOS_ERRO.NAO_IMPLEMENTADO, { mensagem })

export const validacao = (campos, mensagem) =>
  new AppError(CODIGOS_ERRO.VALIDACAO, { campos, mensagem })

export const naoAutorizado = (mensagem) =>
  new AppError(CODIGOS_ERRO.NAO_AUTORIZADO, { mensagem })

export const credenciaisInvalidas = (mensagem) =>
  new AppError(CODIGOS_ERRO.CREDENCIAIS_INVALIDAS, { mensagem })

export const semPermissao = (mensagem) =>
  new AppError(CODIGOS_ERRO.SEM_PERMISSAO, { mensagem })

export const jaAvaliada = (mensagem) =>
  new AppError(CODIGOS_ERRO.JA_AVALIADA, { mensagem })

export { CODIGOS_ERRO, corpoErro, statusDoErro }
