import { PAPEIS, listarSetores } from '../dominio/catalogo.js'
import { validacao } from '../utils/erros.js'
import { booleano, emailValido, texto } from '../utils/texto.js'

function validarSenha(senha, campos, obrigatoria = true) {
  if (!senha && !obrigatoria) return
  if (typeof senha !== 'string' || senha.length < 8) {
    campos.senha = 'A senha deve ter pelo menos 8 caracteres.'
  }
}

export function validarLogin(body = {}) {
  const email = texto(body.email)
  const senha = typeof body.senha === 'string' ? body.senha : ''
  const campos = {}
  if (!email) campos.email = 'Informe o e-mail.'
  if (!senha) campos.senha = 'Informe a senha.'
  if (Object.keys(campos).length > 0) throw validacao(campos, 'Preencha e-mail e senha.')
  return { email, senha }
}

export function validarCriacaoUsuario(body = {}) {
  const campos = {}
  const nome = texto(body.nome)
  const email = texto(body.email)
  const papel = texto(body.papel)
  const setorId = texto(body.setorId)
  const senha = typeof body.senha === 'string' ? body.senha : ''

  if (nome.length < 3) campos.nome = 'Informe o nome do usuário.'
  if (!emailValido(email)) campos.email = 'Informe um e-mail válido.'
  if (!PAPEIS[papel]) campos.papel = 'Escolha um papel válido.'
  validarSenha(senha, campos)
  if (papel === 'setor' && (!setorId || !listarSetores().some((setor) => setor.id === setorId))) {
    campos.setorId = 'Escolha o setor do usuário.'
  }
  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados do usuário.')
  }
  return { nome, email, papel, setorId: papel === 'setor' ? setorId : null, senha }
}

export function validarAtualizacaoUsuario(body = {}, { alvo, ator }) {
  if (alvo.id === ator.id && body.ativo !== undefined && !booleano(body.ativo)) {
    throw validacao({ ativo: 'Você não pode desativar a própria conta.' })
  }
  if (alvo.id === ator.id && body.papel !== undefined && texto(body.papel) !== 'admin') {
    throw validacao({ papel: 'Você não pode remover o próprio acesso de administrador.' })
  }

  const campos = {}
  if (body.email !== undefined && !emailValido(body.email)) {
    campos.email = 'Informe um e-mail válido.'
  }
  if (body.senha) validarSenha(body.senha, campos)
  if (body.papel !== undefined && !PAPEIS[texto(body.papel)]) {
    campos.papel = 'Escolha um papel válido.'
  }

  const papelFinal = body.papel !== undefined ? texto(body.papel) : alvo.papel
  const setorFinal = body.setorId !== undefined
    ? texto(body.setorId)
    : (alvo.papel === 'setor' ? alvo.setorId : '')
  if (papelFinal === 'setor' && (!setorFinal || !listarSetores().some((setor) => setor.id === setorFinal))) {
    campos.setorId = 'Escolha o setor do usuário.'
  }
  if (Object.keys(campos).length > 0) throw validacao(campos, 'Revise os dados do usuário.')

  return {
    nome: body.nome !== undefined ? texto(body.nome) : undefined,
    email: body.email !== undefined ? texto(body.email) : undefined,
    senha: body.senha || undefined,
    papel: body.papel !== undefined ? texto(body.papel) : undefined,
    setorId: body.setorId !== undefined ? texto(body.setorId) : undefined,
    ativo: body.ativo !== undefined ? booleano(body.ativo) : undefined,
  }
}
