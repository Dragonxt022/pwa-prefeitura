/**
 * Envio de e-mail e notificações internas.
 *
 * O transporte é criado sob demanda a partir da configuração salva. Se o envio
 * estiver desligado, nenhuma conexão SMTP é aberta. Falhas ficam registradas no
 * histórico recente exibido na aba de e-mail do painel.
 */
import nodemailer from 'nodemailer'
import {
  CODIGOS_ERRO,
  mensagemDoErro,
} from '../../shared/codigos-erro.js'
import { EVENTOS_NOTIFICACAO } from './configuracoes.js'
import { STATUS, configuracoes, registrarNotificacao } from './store.js'

const URL_APP = (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '')

function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function eventoPorId(id) {
  return EVENTOS_NOTIFICACAO.find((evento) => evento.id === id)
}

function enderecoRemetente(email) {
  const endereco = email.smtp.remetenteEmail
  if (!endereco) return null
  return {
    name: email.smtp.remetenteNome || configuracoes.identidade.nome,
    address: endereco,
  }
}

function falha(codigo, mensagem) {
  return { codigo, mensagem }
}

function validarTransporte(email) {
  if (!email.smtp.host) return falha(CODIGOS_ERRO.SMTP_NAO_CONFIGURADO, 'Informe o servidor SMTP.')
  if (!email.smtp.remetenteEmail) {
    return falha(CODIGOS_ERRO.SMTP_NAO_CONFIGURADO, 'Informe o e-mail do remetente.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.smtp.remetenteEmail)) {
    return falha(CODIGOS_ERRO.SMTP_NAO_CONFIGURADO, 'O e-mail do remetente é inválido.')
  }
  if (!Number.isInteger(email.smtp.porta) || email.smtp.porta < 1 || email.smtp.porta > 65535) {
    return falha(CODIGOS_ERRO.SMTP_NAO_CONFIGURADO, 'A porta SMTP é inválida.')
  }
  if (!Array.isArray(email.destinatarios) || email.destinatarios.length === 0) {
    return falha(CODIGOS_ERRO.SMTP_NAO_CONFIGURADO, 'Cadastre ao menos um destinatário.')
  }
  return null
}

function criarTransporte(email) {
  return nodemailer.createTransport({
    host: email.smtp.host,
    port: email.smtp.porta,
    secure: Boolean(email.smtp.seguro),
    ...(email.smtp.usuario
      ? { auth: { user: email.smtp.usuario, pass: email.smtp.senha || '' } }
      : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
}

function montarMensagem(evento, dados = {}) {
  const rotulo = eventoPorId(evento)?.rotulo ?? 'Notificação'
  const nomeApp = configuracoes.identidade.nome
  const protocolo = dados.protocolo || 'sem protocolo'
  const setor = dados.setorNome || 'Triagem'
  const status = STATUS[dados.status] || dados.status || '—'
  const servico = dados.tipoTitulo || dados.tipo || '—'
  const linhas = [
    `${rotulo} — ${nomeApp}`,
    '',
    `Protocolo: ${protocolo}`,
    `Serviço: ${servico}`,
    `Setor: ${setor}`,
    `Status: ${status}`,
    dados.endereco ? `Endereço: ${dados.endereco}` : null,
    dados.descricao ? `Descrição: ${String(dados.descricao).slice(0, 800)}` : null,
    dados.detalhe ? `Detalhe: ${String(dados.detalhe).slice(0, 500)}` : null,
    dados.nota ? `Avaliação: ${dados.nota} de 5` : null,
    dados.comentario ? `Comentário: ${String(dados.comentario).slice(0, 500)}` : null,
    '',
    `Abrir o painel: ${URL_APP}/gestao`,
  ].filter((linha) => linha !== null)

  const assuntoPorEvento = {
    nova_solicitacao: `Nova solicitação ${protocolo}`,
    mudanca_status: `Atualização ${protocolo}: ${status}`,
    transferencia: `Solicitação ${protocolo} transferida`,
    conclusao: `Atendimento ${protocolo} finalizado`,
    avaliacao: `Nova avaliação ${protocolo}`,
    teste: 'Teste de envio de e-mail',
  }

  const assunto = `[${nomeApp}] ${assuntoPorEvento[evento] ?? rotulo}`
  return {
    assunto,
    texto: linhas.join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.55;color:#101828">
      <h2 style="margin:0 0 12px;font-size:17px">${escaparHtml(rotulo)}</h2>
      <p style="margin:0 0 12px">${escaparHtml(nomeApp)}</p>
      <pre style="margin:0;padding:14px;border-radius:10px;background:#f5f7fa;white-space:pre-wrap;font-family:inherit">${escaparHtml(linhas.join('\n'))}</pre>
      <p style="margin:14px 0 0"><a href="${escaparHtml(URL_APP)}/gestao">Abrir o painel de gestão</a></p>
    </div>`,
  }
}

async function enviar(email, mensagem, destinatarios) {
  const transporte = criarTransporte(email)
  try {
    return await transporte.sendMail({
      from: enderecoRemetente(email),
      to: destinatarios.join(', '),
      replyTo: email.smtp.responderPara || undefined,
      subject: mensagem.assunto,
      text: mensagem.texto,
      html: mensagem.html,
    })
  } finally {
    transporte.close()
  }
}

export async function notificarEvento(evento, dados = {}) {
  const email = configuracoes.email
  if (!email.ativo || !email.eventos?.[evento]?.ativo) {
    return { enviado: false, ignorado: true }
  }

  const problema = validarTransporte(email)
  const mensagem = montarMensagem(evento, dados)
  if (problema) {
    registrarNotificacao({
      evento,
      status: 'erro',
      destinatarios: email.destinatarios,
      assunto: mensagem.assunto,
      protocolo: dados.protocolo,
      codigo: problema.codigo,
      erro: problema.mensagem,
    })
    return { enviado: false, codigo: problema.codigo, erro: problema.mensagem }
  }

  try {
    await enviar(email, mensagem, email.destinatarios)
    registrarNotificacao({
      evento,
      status: 'enviado',
      destinatarios: email.destinatarios,
      assunto: mensagem.assunto,
      protocolo: dados.protocolo,
    })
    return { enviado: true }
  } catch (erro) {
    const detalhe = String(
      erro?.message || mensagemDoErro(CODIGOS_ERRO.SMTP_FALHOU),
    ).slice(0, 400)
    registrarNotificacao({
      evento,
      status: 'erro',
      destinatarios: email.destinatarios,
      assunto: mensagem.assunto,
      protocolo: dados.protocolo,
      codigo: CODIGOS_ERRO.SMTP_FALHOU,
      erro: detalhe,
    })
    return { enviado: false, codigo: CODIGOS_ERRO.SMTP_FALHOU, erro: detalhe }
  }
}

export async function testarEnvioEmail({ destinatario } = {}) {
  const email = configuracoes.email
  const alvo = String(destinatario || email.destinatarios[0] || '').trim()
  const problema = validarTransporte({
    ...email,
    destinatarios: alvo ? [alvo] : [],
  })
  if (problema) return { enviado: false, codigo: problema.codigo, erro: problema.mensagem }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alvo)) {
    return {
      enviado: false,
      codigo: CODIGOS_ERRO.SMTP_DESTINATARIO_INVALIDO,
      erro: mensagemDoErro(CODIGOS_ERRO.SMTP_DESTINATARIO_INVALIDO),
    }
  }

  const mensagem = montarMensagem('teste', {
    detalhe: 'Este é um envio de teste disparado pelo painel de configurações.',
  })
  try {
    await enviar({ ...email, destinatarios: [alvo] }, mensagem)
    registrarNotificacao({
      evento: 'teste',
      status: 'enviado',
      destinatarios: [alvo],
      assunto: mensagem.assunto,
    })
    return { enviado: true, destinatario: alvo }
  } catch (erro) {
    const detalhe = String(
      erro?.message || mensagemDoErro(CODIGOS_ERRO.SMTP_FALHOU),
    ).slice(0, 400)
    registrarNotificacao({
      evento: 'teste',
      status: 'erro',
      destinatarios: [alvo],
      assunto: mensagem.assunto,
      codigo: CODIGOS_ERRO.SMTP_FALHOU,
      erro: detalhe,
    })
    return {
      enviado: false,
      codigo: CODIGOS_ERRO.SMTP_FALHOU,
      destinatario: alvo,
      erro: detalhe,
    }
  }
}
