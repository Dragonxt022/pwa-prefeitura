/**
 * Tratamento centralizado de erros e fallback de rotas de API.
 */
import {
  AppError,
  CODIGOS_ERRO,
  corpoErro,
  naoEncontrado,
  statusDoErro,
} from '../utils/erros.js'

export function apiNaoEncontrada(req) {
  throw naoEncontrado(`Rota de API inexistente: ${req.method} ${req.originalUrl}`)
}

export function tratarErro(erro, _req, res, _next) {
  if (erro instanceof AppError) {
    return res
      .status(erro.status)
      .json(corpoErro(erro.codigo, { mensagem: erro.mensagem, campos: erro.campos }))
  }

  if (erro?.type === 'entity.parse.failed') {
    return res
      .status(statusDoErro(CODIGOS_ERRO.JSON_INVALIDO))
      .json(corpoErro(CODIGOS_ERRO.JSON_INVALIDO))
  }

  if (erro?.type === 'entity.too.large') {
    return res
      .status(statusDoErro(CODIGOS_ERRO.CORPO_MUITO_GRANDE))
      .json(
        corpoErro(CODIGOS_ERRO.CORPO_MUITO_GRANDE, {
          mensagem: 'O conteúdo enviado excede o limite de 2 MB.',
        }),
      )
  }

  console.error('[erro não tratado]', erro)
  return res
    .status(statusDoErro(CODIGOS_ERRO.ERRO_INTERNO))
    .json(
      corpoErro(CODIGOS_ERRO.ERRO_INTERNO, {
        mensagem: 'Erro inesperado no servidor de simulação.',
      }),
    )
}
