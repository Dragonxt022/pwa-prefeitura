/**
 * Controllers das configurações administrativas.
 */
import {
  configuracoesAdmin,
  opcoesConfiguracoes,
} from '../../apresentadores/configuracoes.js'
import { naoEncontrado, validacao } from '../../utils/erros.js'
import {
  atualizarConfiguracao,
  obterConfiguracoes,
  testarConfiguracaoIA,
} from '../../servicos/configuracoes.js'
import { testarEnvioEmail } from '../../servicos/notificacoes.js'
import { texto } from '../../utils/texto.js'

export function obter(_req, res) {
  res.json({
    dados: configuracoesAdmin(obterConfiguracoes()),
    opcoes: opcoesConfiguracoes(),
  })
}

export function salvarSecao(req, res) {
  const secao = texto(req.params.secao)
  const resultado = atualizarConfiguracao(secao, req.body, req.usuario)
  if (!resultado) {
    throw naoEncontrado('Seção de configuração desconhecida.')
  }
  if (resultado.campos) {
    throw validacao(resultado.campos, 'Revise os campos destacados.')
  }
  res.json({ dados: configuracoesAdmin(resultado.dados) })
}

export async function testarEmail(req, res) {
  const destinatario = texto(req.body?.destinatario)
  const resultado = await testarEnvioEmail({ destinatario })
  res.json({
    dados: {
      ...resultado,
      notificacoes: configuracoesAdmin(obterConfiguracoes()).notificacoes,
    },
  })
}

export async function testarIA(req, res) {
  const resultado = await testarConfiguracaoIA(req.body)
  if (resultado.campos) {
    throw validacao(resultado.campos, 'Revise a configuração antes de testar.')
  }
  res.json({ dados: resultado.resultado })
}
