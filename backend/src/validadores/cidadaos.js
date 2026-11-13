/**
 * Validação do cadastro, login e edição do perfil do cidadão.
 *
 * As mensagens ficam por campo para o formulário destacar exatamente o que
 * precisa ser corrigido. Nenhum dado é silenciosamente descartado.
 */
import {
  VERSAO_PRIVACIDADE,
  normalizarCep,
  normalizarTelefone,
} from '../dominio/cidadaos.js'
import { validacao } from '../utils/erros.js'
import { emailValido, texto } from '../utils/texto.js'

const SENHA_MIN = 8
const SENHA_MAX = 72

function lerNome(valor, campos) {
  const nome = texto(valor)
  if (nome.length < 3) campos.nome = 'Informe seu nome completo.'
  else if (nome.length > 120) campos.nome = 'Use no máximo 120 caracteres.'
  return nome
}

function lerEmail(valor, campos) {
  const email = texto(valor).toLowerCase()
  if (!emailValido(email)) campos.email = 'Informe um e-mail válido.'
  else if (email.length > 180) campos.email = 'Use no máximo 180 caracteres.'
  return email
}

function lerSenha(valor, campos, { opcional = false } = {}) {
  if (opcional && (valor === undefined || valor === '')) return undefined
  const senha = String(valor ?? '')
  if (senha.length < SENHA_MIN) {
    campos.senha = `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`
  } else if (senha.length > SENHA_MAX) {
    campos.senha = `A senha pode ter no máximo ${SENHA_MAX} caracteres.`
  }
  return senha
}

function lerTelefone(valor, campos) {
  const telefone = normalizarTelefone(valor)
  if (telefone.length !== 10 && telefone.length !== 11) {
    campos.telefone = 'Informe o telefone com DDD.'
  }
  return telefone
}

function lerCep(valor, campos) {
  const cep = normalizarCep(valor)
  if (cep.length !== 8) campos.cep = 'Informe um CEP com 8 dígitos.'
  return cep
}

function lerCampoObrigatorio(valor, campo, rotulo, campos, { minimo = 2, maximo = 120 } = {}) {
  const limpo = texto(valor)
  if (limpo.length < minimo) campos[campo] = `Informe ${rotulo}.`
  else if (limpo.length > maximo) campos[campo] = `Use no máximo ${maximo} caracteres.`
  return limpo
}

function lerUf(valor, campos) {
  const uf = texto(valor).toUpperCase()
  if (!/^[A-Z]{2}$/.test(uf)) campos.uf = 'Use a sigla do estado com 2 letras.'
  return uf
}

function lerEndereco(body, campos, { opcional = false } = {}) {
  const dados = {}
  const vazio = !texto(body.cep) && !texto(body.logradouro) && !texto(body.bairro) &&
    !texto(body.cidade) && !texto(body.uf)
  if (opcional && vazio) return dados

  dados.cep = lerCep(body.cep, campos)
  dados.logradouro = lerCampoObrigatorio(body.logradouro, 'logradouro', 'o logradouro', campos, {
    minimo: 3,
    maximo: 180,
  })
  const numero = texto(body.numero)
  if (!numero) campos.numero = 'Informe o número.'
  else if (numero.length > 20) campos.numero = 'Use no máximo 20 caracteres.'
  dados.numero = numero

  const complemento = texto(body.complemento)
  if (complemento.length > 80) campos.complemento = 'Use no máximo 80 caracteres.'
  dados.complemento = complemento || null

  dados.bairro = lerCampoObrigatorio(body.bairro, 'bairro', 'o bairro', campos)
  dados.cidade = lerCampoObrigatorio(body.cidade, 'cidade', 'a cidade', campos)
  dados.uf = lerUf(body.uf, campos)
  return dados
}

export function validarCadastro(body = {}) {
  const campos = {}
  const dados = {
    nome: lerNome(body.nome, campos),
    email: lerEmail(body.email, campos),
    senha: lerSenha(body.senha, campos),
    telefone: lerTelefone(body.telefone, campos),
    ...lerEndereco(body, campos),
  }

  if (body.consentimento !== true) {
    campos.consentimento = 'É necessário aceitar o Aviso de Privacidade para criar a conta.'
  }

  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados do cadastro.')
  }

  return {
    ...dados,
    consentimentoEm: new Date().toISOString(),
    consentimentoVersao: VERSAO_PRIVACIDADE,
  }
}

export function validarLogin(body = {}) {
  const campos = {}
  const email = lerEmail(body.email, campos)
  const senha = String(body.senha ?? '')
  if (!senha) campos.senha = 'Informe sua senha.'

  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Informe e-mail e senha.')
  }
  return { email, senha }
}

export function validarAtualizacaoPerfil(body = {}) {
  const campos = {}
  const dados = {}

  if (body.nome !== undefined) dados.nome = lerNome(body.nome, campos)
  if (body.email !== undefined) dados.email = lerEmail(body.email, campos)
  if (body.senha !== undefined) {
    const senha = lerSenha(body.senha, campos, { opcional: true })
    if (senha !== undefined) dados.senha = senha
  }
  if (body.telefone !== undefined) dados.telefone = lerTelefone(body.telefone, campos)

  // Atualização é parcial: valida apenas os campos de endereço enviados.
  if (body.cep !== undefined) dados.cep = lerCep(body.cep, campos)
  if (body.logradouro !== undefined) {
    dados.logradouro = lerCampoObrigatorio(
      body.logradouro, 'logradouro', 'o logradouro', campos, { minimo: 3, maximo: 180 },
    )
  }
  if (body.numero !== undefined) {
    const numero = texto(body.numero)
    if (!numero) campos.numero = 'Informe o número.'
    else if (numero.length > 20) campos.numero = 'Use no máximo 20 caracteres.'
    dados.numero = numero
  }
  if (body.complemento !== undefined) {
    const complemento = texto(body.complemento)
    if (complemento.length > 80) campos.complemento = 'Use no máximo 80 caracteres.'
    dados.complemento = complemento || null
  }
  if (body.bairro !== undefined) {
    dados.bairro = lerCampoObrigatorio(body.bairro, 'bairro', 'o bairro', campos)
  }
  if (body.cidade !== undefined) {
    dados.cidade = lerCampoObrigatorio(body.cidade, 'cidade', 'a cidade', campos)
  }
  if (body.uf !== undefined) dados.uf = lerUf(body.uf, campos)

  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados do perfil.')
  }
  return dados
}

export function validarSolicitacaoRecuperacao(body = {}) {
  const campos = {}
  const email = lerEmail(body.email, campos)
  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Informe o e-mail da conta.')
  }
  return { email }
}

export function validarRedefinicaoSenha(body = {}) {
  const campos = {}
  const token = String(body.token ?? '').trim()
  if (token.length < 20) campos.token = 'Link de recuperação inválido.'
  const novaSenha = lerSenha(body.novaSenha, campos)
  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados para criar a nova senha.')
  }
  return { token, novaSenha }
}

export function validarExclusaoConta(body = {}) {
  const senha = String(body.senha ?? '')
  if (!senha) {
    throw validacao({ senha: 'Informe sua senha para confirmar a exclusão.' })
  }
  return { senha }
}
