/**
 * Transporte SMTP compartilhado por notificações e e-mails transacionais.
 *
 * O remetente vem da configuração administrativa. Nenhuma credencial é
 * registrada em log e o transporte é fechado após cada envio.
 */
import nodemailer from 'nodemailer'

export function criarTransporte(email) {
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

export function enderecoRemetente(email) {
  if (!email.smtp.remetenteEmail) return null
  return {
    name: email.smtp.remetenteNome || 'Prefeitura Digital',
    address: email.smtp.remetenteEmail,
  }
}

export async function enviarEmail({ email, para, assunto, texto, html }) {
  const transporte = criarTransporte(email)
  try {
    await transporte.sendMail({
      from: enderecoRemetente(email),
      to: para,
      replyTo: email.smtp.responderPara || undefined,
      subject: assunto,
      text: texto,
      html,
    })
    return { enviado: true }
  } finally {
    transporte.close()
  }
}
