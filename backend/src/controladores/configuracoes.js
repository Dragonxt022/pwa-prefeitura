/**
 * Controller da configuração pública.
 *
 * Somente identidade visual e contatos saem desta rota. SMTP, destinatários e
 * IA continuam restritos ao serviço administrativo.
 */
import { configuracoesPublicas } from '../apresentadores/configuracoes.js'
import { obterConfiguracoes } from '../servicos/configuracoes.js'

export function obterConfiguracoesPublicas(_req, res) {
  res.set('Cache-Control', 'no-cache')
  res.json({ dados: configuracoesPublicas(obterConfiguracoes()) })
}
