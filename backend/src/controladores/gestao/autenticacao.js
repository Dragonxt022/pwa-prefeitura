/**
 * Controllers de autenticação e contexto da gestão.
 */
import * as catalogo from '../../dominio/catalogo.js'
import { credenciaisInvalidas } from '../../utils/erros.js'
import {
  definirCookieSessao,
  limparCookieSessao,
  tokenDaRequisicao,
} from '../../middlewares/autenticacao.js'
import { triagemAutomaticaAtiva } from '../../servicos/configuracoes.js'
import {
  autenticarUsuario,
  criarSessao,
  revogarSessao,
} from '../../servicos/usuarios.js'
import { usuarioPublico } from '../../apresentadores/usuarios.js'
import { booleano } from '../../utils/texto.js'
import { validarLogin } from '../../validadores/usuarios.js'

export function login(req, res) {
  const { email, senha } = validarLogin(req.body)
  const usuario = autenticarUsuario(email, senha)
  if (!usuario) {
    throw credenciaisInvalidas('E-mail ou senha inválidos.')
  }

  const lembrar = booleano(req.body?.lembrar)
  const { token, sessao } = criarSessao(usuario.id, { lembrar })
  definirCookieSessao(res, token, lembrar)
  return res.json({
    dados: {
      usuario: usuarioPublico(usuario),
      expiraEm: sessao.expiraEm,
      lembrar: sessao.lembrar,
      triagemAutomatica: triagemAutomaticaAtiva(),
    },
  })
}

export function logout(req, res) {
  const token = tokenDaRequisicao(req)
  if (token) revogarSessao(token)
  limparCookieSessao(res)
  res.json({ dados: { ok: true } })
}

export function obterSessao(req, res) {
  res.json({
    dados: {
      usuario: usuarioPublico(req.usuario),
      triagemAutomatica: triagemAutomaticaAtiva(),
    },
  })
}

export function listarSetores(_req, res) {
  res.json({ dados: catalogo.listarSetores() })
}
