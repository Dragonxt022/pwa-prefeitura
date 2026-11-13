/**
 * Recuperação de senha do cidadão.
 *
 * O pedido é sempre respondido de forma genérica para não revelar se o e-mail
 * existe. O código enviado por e-mail tem 30 minutos de validade, uso único e
 * é guardado apenas como hash. A redefinição revoga todas as sessões abertas.
 */
import { randomBytes } from 'node:crypto'
import { normalizarCidadao } from '../dominio/cidadaos.js'
import { gerarHashSenha, hashToken } from '../utils/seguranca.js'
import { normalizarEmail } from '../utils/texto.js'
import {
  obter as obterConfiguracoes,
} from '../repositorios/configuracoes.js'
import * as repositorioCidadaos from '../repositorios/cidadaos.js'
import * as repositorioRecuperacao from '../repositorios/recuperacao-senha.js'
import * as repositorioSessoes from '../repositorios/sessoes-cidadao.js'
import { enviarEmail } from './email-transporte.js'

const VALIDADE_MINUTOS = 30
const URL_APP = (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '')

function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function enviarEmailPadrao({ para, nome, link, nomeApp }) {
  const email = obterConfiguracoes().email
  if (!email.smtp.host || !email.smtp.remetenteEmail) {
    return { enviado: false, motivo: 'smtp_nao_configurado' }
  }

  const texto = [
    `Olá, ${nome}.`,
    '',
    `Recebemos um pedido para redefinir sua senha em ${nomeApp}.`,
    `Acesse o link abaixo (válido por ${VALIDADE_MINUTOS} minutos):`,
    link,
    '',
    'Se você não fez este pedido, ignore esta mensagem. Sua senha atual continua valendo.',
  ].join('\n')

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.55;color:#101828">
    <h2 style="margin:0 0 12px;font-size:17px">Redefinição de senha</h2>
    <p>Olá, ${escaparHtml(nome)}.</p>
    <p>Recebemos um pedido para redefinir sua senha em ${escaparHtml(nomeApp)}.</p>
    <p><a href="${escaparHtml(link)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#1351B4;color:#fff;text-decoration:none">Criar nova senha</a></p>
    <p style="color:#667085;font-size:13px">O link vale por ${VALIDADE_MINUTOS} minutos e só pode ser usado uma vez. Se você não fez o pedido, ignore esta mensagem.</p>
  </div>`

  try {
    await enviarEmail({
      email,
      para,
      assunto: `[${nomeApp}] Redefinição de senha`,
      texto,
      html,
    })
    return { enviado: true }
  } catch (erro) {
    // Sem destinatário nem token no log.
    console.warn('[recuperacao] falha ao enviar e-mail de redefinição:', erro?.message)
    return { enviado: false, motivo: 'falha_envio' }
  }
}

/**
 * Cria o token e dispara o e-mail. Exportado para testes com um enviador
 * simulado; o token bruto nunca é persistido nem devolvido pela rota HTTP.
 */
export async function criarTokenRecuperacao(cidadao, { enviar = enviarEmailPadrao } = {}) {
  const token = randomBytes(32).toString('base64url')
  const agora = new Date()
  const expiraEm = new Date(
    agora.getTime() + VALIDADE_MINUTOS * 60 * 1000,
  ).toISOString()
  await repositorioRecuperacao.criar({
    cidadaoId: cidadao.id,
    tokenHash: hashToken(token),
    expiraEm,
    criadoEm: agora.toISOString(),
    usadoEm: null,
  })

  const nomeApp = obterConfiguracoes().identidade.nome || 'Prefeitura Digital'
  // O token vai no fragmento para não aparecer em logs de acesso nem em Referer.
  const link = `${URL_APP}/redefinir-senha#token=${encodeURIComponent(token)}`
  const envio = await enviar({
    para: cidadao.email,
    nome: cidadao.nome,
    link,
    nomeApp,
  })
  return { token, expiraEm, link, enviado: Boolean(envio?.enviado) }
}

/**
 * Gera o link para um administrador enviar por um canal verificado. Não usa
 * SMTP e nunca registra o token.
 */
export async function gerarLinkRecuperacao(email) {
  const cidadao = repositorioCidadaos.buscarPorEmail(normalizarEmail(email))
  if (!cidadao || !cidadao.ativo) return null
  const { link, expiraEm } = await criarTokenRecuperacao(cidadao, {
    enviar: async () => ({ enviado: false }),
  })
  return { link, expiraEm }
}

export async function solicitarRecuperacao(email, opcoes = {}) {
  const cidadao = repositorioCidadaos.buscarPorEmail(normalizarEmail(email))
  if (!cidadao || !cidadao.ativo) return { ok: true }
  await criarTokenRecuperacao(cidadao, opcoes)
  return { ok: true }
}

export async function redefinirSenha(token, novaSenha) {
  const bruto = String(token ?? '').trim()
  if (bruto.length < 20) return { erro: 'token_invalido' }

  const registro = await repositorioRecuperacao.buscarPorTokenHash(hashToken(bruto))
  if (!registro || registro.usadoEm) return { erro: 'token_invalido' }
  if (new Date(registro.expiraEm).getTime() <= Date.now()) {
    return { erro: 'token_expirado' }
  }

  const cidadao = repositorioCidadaos.buscar(registro.cidadaoId)
  if (!cidadao || !cidadao.ativo) return { erro: 'token_invalido' }

  const agora = new Date()
  await repositorioCidadaos.salvar(
    normalizarCidadao({
      ...cidadao,
      senhaHash: gerarHashSenha(novaSenha),
      atualizadoEm: agora.toISOString(),
    }),
  )
  await repositorioRecuperacao.marcarUsado(registro.id, agora.toISOString())
  await repositorioSessoes.removerDoCidadao(cidadao.id)
  return { ok: true }
}
