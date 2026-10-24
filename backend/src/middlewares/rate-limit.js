import {
  CODIGOS_ERRO,
  corpoErro,
  statusDoErro,
} from '../../../shared/codigos-erro.js'

/**
 * Rate limit simples em memoria (fixed window por IP).
 * Suficiente para o piloto; em producao usar Redis e limites por rota/usuario.
 */
export function criarRateLimit({ janelaMs = 60_000, maximo = 10 } = {}) {
  const registros = new Map()

  return (req, res, next) => {
    const chave = req.ip
    const agora = Date.now()
    const registro = registros.get(chave)

    if (!registro || agora - registro.inicio > janelaMs) {
      registros.set(chave, { inicio: agora, total: 1 })
      return next()
    }

    registro.total += 1
    if (registro.total > maximo) {
      res.set('Retry-After', String(Math.ceil((registro.inicio + janelaMs - agora) / 1000)))
      return res
        .status(statusDoErro(CODIGOS_ERRO.LIMITE_EXCEDIDO))
        .json(corpoErro(CODIGOS_ERRO.LIMITE_EXCEDIDO))
    }

    return next()
  }
}
