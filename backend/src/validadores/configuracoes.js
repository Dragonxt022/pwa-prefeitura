/**
 * Validação das seções de configuração administrativa.
 *
 * A normalização e os valores padrão pertencem ao domínio; aqui ficam apenas
 * as regras que precisam produzir campos de erro para o formulário.
 */
import {
  ANO_ATUAL,
  corValida,
  imagemValida,
  listaEmails,
  listaTextos,
  normalizarEmail,
  normalizarIA,
  normalizarIdentidade,
  normalizarRedes,
  provedorIA,
  urlValida,
} from '../dominio/configuracoes.js'
import { emailValido, texto } from '../utils/texto.js'

/**
 * Valida a identidade recebida do painel. Retorna campos inválidos em vez de
 * descartá-los silenciosamente.
 */
export function prepararIdentidade(entrada = {}, atual) {
  const campos = {}
  const nome = texto(entrada.nome ?? atual.nome)
  if (nome.length < 2) campos.nome = 'Informe o nome da aplicação.'
  if (nome.length > 80) campos.nome = 'O nome deve ter no máximo 80 caracteres.'

  for (const chave of ['corPrimaria', 'corSecundaria', 'corDestaque']) {
    if (entrada[chave] !== undefined && !corValida(entrada[chave])) {
      campos[chave] = 'Use uma cor hexadecimal no formato #RRGGBB.'
    }
  }

  for (const chave of ['logo', 'icone']) {
    if (entrada[chave] !== undefined && entrada[chave] !== null && !imagemValida(entrada[chave])) {
      campos[chave] = 'Envie uma imagem PNG, JPEG ou WebP de até 1,5 MB, ou uma URL http(s).'
    }
  }

  const telefones = listaTextos(entrada.telefones, atual.telefones)
  if (telefones.length > 10) campos.telefones = 'Cadastre no máximo 10 telefones.'
  if (telefones.some((item) => item.length > 40)) {
    campos.telefones = 'Cada telefone deve ter no máximo 40 caracteres.'
  }

  const emails = listaEmails(entrada.emails, atual.emails)
  if (emails.length > 10) campos.emails = 'Cadastre no máximo 10 e-mails.'
  if (emails.some((item) => !emailValido(item))) {
    campos.emails = 'Informe apenas e-mails válidos.'
  }

  const redes = normalizarRedes(entrada.redesSociais, atual.redesSociais)
  if (redes.length > 12) campos.redesSociais = 'Cadastre no máximo 12 redes sociais.'
  if (redes.some((rede) => !urlValida(rede.url))) {
    campos.redesSociais = 'Cada rede social precisa de uma URL http(s) válida.'
  }
  if (redes.some((rede) => rede.rede === 'outro' && !rede.rotulo)) {
    campos.redesSociais = 'Informe o nome das redes marcadas como “Outro”.'
  }

  const rodape = entrada.rodape ?? {}
  const textoRodape = texto(rodape.texto ?? atual.rodape?.texto)
  if (textoRodape.length > 500) campos.rodape = 'O texto do rodapé deve ter no máximo 500 caracteres.'
  const anoCriacao = Number(rodape.anoCriacao ?? atual.rodape?.anoCriacao)
  if (!Number.isInteger(anoCriacao) || anoCriacao < 1900 || anoCriacao > ANO_ATUAL + 1) {
    campos.anoCriacao = 'Informe um ano de criação válido.'
  }
  if (texto(rodape.direitos ?? atual.rodape?.direitos).length > 160) {
    campos.direitos = 'O texto de direitos deve ter no máximo 160 caracteres.'
  }

  if (Object.keys(campos).length > 0) return { campos }
  return { dados: normalizarIdentidade(entrada, atual) }
}

export function prepararEmail(entrada = {}, atual) {
  const campos = {}
  const dados = normalizarEmail(entrada, atual)

  if (dados.smtp.host && dados.smtp.host.length > 160) {
    campos.host = 'O servidor SMTP deve ter no máximo 160 caracteres.'
  }
  if (dados.smtp.remetenteEmail && !emailValido(dados.smtp.remetenteEmail)) {
    campos.remetenteEmail = 'Informe um e-mail de remetente válido.'
  }
  if (dados.smtp.responderPara && !emailValido(dados.smtp.responderPara)) {
    campos.responderPara = 'Informe um e-mail de resposta válido.'
  }
  if (Array.isArray(entrada.destinatarios) && entrada.destinatarios.some((item) => texto(item) && !emailValido(item))) {
    campos.destinatarios = 'Informe apenas e-mails válidos.'
  }
  if (dados.destinatarios.length === 0 && dados.ativo) {
    campos.destinatarios = 'Cadastre ao menos um destinatário para ativar os e-mails.'
  }
  if (dados.ativo) {
    if (!dados.smtp.host) campos.host = 'Informe o servidor SMTP para ativar os e-mails.'
    if (!dados.smtp.remetenteEmail) campos.remetenteEmail = 'Informe o e-mail do remetente.'
  }
  if (typeof entrada.smtp?.senha === 'string' && entrada.smtp.senha.length > 500) {
    campos.senha = 'A senha SMTP deve ter no máximo 500 caracteres.'
  }
  if (Object.keys(campos).length > 0) return { campos }
  return { dados }
}

export function prepararIA(entrada = {}, atual) {
  const campos = {}
  const dados = normalizarIA(entrada, atual)
  const provedor = provedorIA(dados.provedor)

  if (dados.provedor !== 'regras') {
    if (!dados.modelo) campos.modelo = 'Informe o modelo que será usado.'
    if (!dados.baseUrl || !urlValida(dados.baseUrl)) {
      campos.baseUrl = 'Informe uma URL http(s) válida para o endpoint.'
    }
  }
  if (dados.ativo && provedor.requerChave && !dados.apiKey) {
    campos.apiKey = 'Informe a chave de API deste provedor.'
  }
  if (dados.ativo && dados.provedor === 'regras') {
    campos.provedor = 'Escolha um modelo externo para ativar a IA generativa. Para regras locais, use apenas a aplicação automática.'
  }
  if (typeof entrada.apiKey === 'string' && entrada.apiKey.length > 500) {
    campos.apiKey = 'A chave deve ter no máximo 500 caracteres.'
  }
  if (Object.keys(campos).length > 0) return { campos }
  return { dados }
}
