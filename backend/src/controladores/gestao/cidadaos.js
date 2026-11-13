/**
 * Recuperação assistida pelo administrador.
 *
 * Quando o SMTP não está configurado (ou o e-mail não chega), o admin pode
 * gerar um link de uso único e entregá-lo ao cidadão por um canal verificado.
 */
import { emailValido, texto } from '../../utils/texto.js'
import { naoEncontrado, validacao } from '../../utils/erros.js'
import { gerarLinkRecuperacao } from '../../servicos/recuperacao-senha.js'

export async function gerarRecuperacao(req, res) {
  const email = texto(req.body?.email).toLowerCase()
  if (!emailValido(email)) {
    throw validacao({ email: 'Informe o e-mail da conta do cidadão.' })
  }

  const dados = await gerarLinkRecuperacao(email)
  if (!dados) throw naoEncontrado('Nenhuma conta ativa com este e-mail.')

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.json({ dados })
}
