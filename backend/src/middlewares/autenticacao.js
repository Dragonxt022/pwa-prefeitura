/**
 * Autenticação por cookie de sessão e autorização por papel/setor.
 *
 * O token opaco nunca é devolvido no JSON: a API grava apenas o hash no estado
 * e envia o valor ao navegador via cookie HttpOnly.
 */
import { naoAutorizado, semPermissao } from '../utils/erros.js'
import { buscarAdminAtivo, usuarioDaSessao } from '../servicos/usuarios.js'

export const COOKIE_SESSAO = 'prefeitura_sessao'
const TOKEN_ADMIN_LEGADO = process.env.ADMIN_TOKEN || ''
const DIAS_COOKIE_LEMBRAR = Math.max(1, Number(process.env.SESSION_DAYS) || 30)

function lerCookie(req, nome) {
  const cabecalho = req.get('cookie') || ''
  for (const parte of cabecalho.split(';')) {
    const [chave, ...resto] = parte.trim().split('=')
    if (chave === nome) {
      try {
        return decodeURIComponent(resto.join('='))
      } catch {
        return resto.join('=')
      }
    }
  }
  return ''
}

export function tokenDaRequisicao(req) {
  return lerCookie(req, COOKIE_SESSAO)
}

function autenticacaoDaRequisicao(req) {
  const token = tokenDaRequisicao(req)
  const usuarioDaCookie = usuarioDaSessao(token)
  if (usuarioDaCookie) return { usuario: usuarioDaCookie, token }

  // Compatibilidade com scripts e testes antigos. O token legado é aceito
  // somente como administrador e não cria uma sessão persistente.
  if (TOKEN_ADMIN_LEGADO && req.get('x-admin-token') === TOKEN_ADMIN_LEGADO) {
    const admin = buscarAdminAtivo()
    if (admin) return { usuario: admin, token: '' }
  }

  return null
}

export function exigirSessao(req, _res, next) {
  const autenticacao = autenticacaoDaRequisicao(req)
  if (!autenticacao) {
    throw naoAutorizado('Sessão ausente ou expirada. Entre novamente.')
  }
  req.usuario = autenticacao.usuario
  req.sessaoToken = autenticacao.token
  next()
}

export function exigirAdmin(req, _res, next) {
  if (req.usuario?.papel !== 'admin') {
    throw semPermissao('Apenas administradores podem executar esta ação.')
  }
  next()
}

export function podeAcessarSolicitacao(usuario, solicitacao) {
  if (!solicitacao) return false
  if (usuario.papel === 'setor') return solicitacao.setorId === usuario.setorId
  return true
}

export function setorDoFiltro(req) {
  if (req.usuario.papel === 'setor') return req.usuario.setorId
  return typeof req.query.setor === 'string' ? req.query.setor.trim() : undefined
}

export function definirCookieSessao(res, token, lembrar) {
  const atributos = [
    `${COOKIE_SESSAO}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.COOKIE_SECURE === 'true') atributos.push('Secure')
  if (lembrar) atributos.push(`Max-Age=${DIAS_COOKIE_LEMBRAR * 24 * 60 * 60}`)
  res.append('Set-Cookie', atributos.join('; '))
}

export function limparCookieSessao(res) {
  const atributos = [
    `${COOKIE_SESSAO}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]
  if (process.env.COOKIE_SECURE === 'true') atributos.push('Secure')
  res.append('Set-Cookie', atributos.join('; '))
}
