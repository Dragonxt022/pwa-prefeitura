/**
 * Controllers de usuários no painel administrativo.
 */
import { PAPEIS } from '../../dominio/catalogo.js'
import { naoEncontrado, validacao } from '../../utils/erros.js'
import {
  atualizarUsuario,
  buscarUsuario,
  criarUsuario,
  listarUsuarios,
} from '../../servicos/usuarios.js'
import { usuarioPublico } from '../../apresentadores/usuarios.js'
import {
  validarAtualizacaoUsuario,
  validarCriacaoUsuario,
} from '../../validadores/usuarios.js'

export function listar(_req, res) {
  res.json({
    dados: listarUsuarios().map(usuarioPublico),
    papeis: PAPEIS,
  })
}

export function criar(req, res) {
  const dados = validarCriacaoUsuario(req.body)
  const resultado = criarUsuario(dados)
  if (resultado.erro === 'email_em_uso') {
    throw validacao({ email: 'Já existe um usuário com este e-mail.' })
  }
  if (resultado.erro) throw validacao({}, 'Não foi possível criar o usuário.')
  res.status(201).json({ dados: usuarioPublico(resultado.usuario) })
}

export function atualizar(req, res) {
  const alvo = buscarUsuario(req.params.id)
  if (!alvo) throw naoEncontrado('Usuário não encontrado.')

  const dados = validarAtualizacaoUsuario(req.body, { alvo, ator: req.usuario })
  const resultado = atualizarUsuario(alvo.id, dados)
  if (resultado.erro === 'email_em_uso') {
    throw validacao({ email: 'Já existe um usuário com este e-mail.' })
  }
  if (resultado.erro) throw validacao({}, 'Não foi possível atualizar o usuário.')
  res.json({ dados: usuarioPublico(resultado.usuario) })
}
