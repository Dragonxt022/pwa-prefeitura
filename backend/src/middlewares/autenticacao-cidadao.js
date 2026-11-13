/**
 * Sessão do cidadão.
 *
 * Cookie próprio, separado da sessão de gestão. O token é opaco e o banco
 * guarda apenas o hash. Rotas de perfil exigem sessão válida e nunca aceitam
 * um identificador de cidadão vindo do cliente.
 */
import { naoAutorizado } from '../utils/erros.js'
import { definirCookie, lerCookie, limparCookie } from '../utils/cookies.js'
import { cidadaoDaSessao } from '../servicos/cidadaos.js'

export const COOKIE_CIDADAO = 'prefeitura_cidadao'
const COOKIE_SEGURO = process.env.COOKIE_SECURE === 'true'
const DIAS_COOKIE_LEMBRAR = Math.max(1, Number(process.env.CIDADAO_SESSION_DAYS) || 30)

export function tokenDoCidadao(req) {
  return lerCookie(req, COOKIE_CIDADAO)
}

export function definirCookieCidadao(res, token, lembrar) {
  definirCookie(res, COOKIE_CIDADAO, token, {
    seguro: COOKIE_SEGURO,
    maxAgeSegundos: lembrar ? DIAS_COOKIE_LEMBRAR * 24 * 60 * 60 : null,
  })
}

export function limparCookieCidadao(res) {
  limparCookie(res, COOKIE_CIDADAO, { seguro: COOKIE_SEGURO })
}

/** Carrega a sessão se existir, sem exigir autenticação. */
export async function carregarCidadao(req, _res, next) {
  const token = tokenDoCidadao(req)
  if (token) {
    const cidadao = await cidadaoDaSessao(token)
    if (cidadao) {
      req.cidadao = cidadao
      req.tokenCidadao = token
    }
  }
  next()
}

/** Exige uma sessão de cidadão válida. */
export async function exigirCidadao(req, _res, next) {
  const token = tokenDoCidadao(req)
  const cidadao = await cidadaoDaSessao(token)
  if (!cidadao) {
    throw naoAutorizado('Entre na sua conta para acessar o perfil.')
  }
  req.cidadao = cidadao
  req.tokenCidadao = token
  next()
}
