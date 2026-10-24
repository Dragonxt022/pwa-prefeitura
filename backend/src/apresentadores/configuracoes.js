/**
 * Contratos de configuração expostos pela API.
 *
 * A configuração administrativa nunca devolve `senha` SMTP nem `apiKey`; ela
 * expõe apenas os indicadores `temSenha` e `temApiKey`.
 */
import {
  ANO_ATUAL,
  EVENTOS_NOTIFICACAO,
  PROVEDORES_IA,
  REDES_SOCIAIS,
} from '../dominio/configuracoes.js'

export function identidadePublica(config) {
  return {
    ...config.identidade,
    telefones: [...config.identidade.telefones],
    emails: [...config.identidade.emails],
    redesSociais: config.identidade.redesSociais.map((rede) => ({ ...rede })),
    rodape: { ...config.identidade.rodape },
  }
}

export function configuracoesPublicas(config) {
  return { identidade: identidadePublica(config) }
}

export function configuracoesAdmin(config) {
  const { senha, ...smtp } = config.email.smtp
  const { apiKey, ...ia } = config.ia
  return {
    identidade: identidadePublica(config),
    email: {
      ...config.email,
      smtp: { ...smtp, temSenha: Boolean(senha) },
      destinatarios: [...config.email.destinatarios],
      eventos: Object.fromEntries(
        Object.entries(config.email.eventos).map(([chave, valor]) => [chave, { ...valor }]),
      ),
    },
    ia: { ...ia, temApiKey: Boolean(apiKey) },
    notificacoes: config.notificacoes.map((item) => ({ ...item })),
    atualizadoEm: config.atualizadoEm,
    atualizadoPor: config.atualizadoPor ? { ...config.atualizadoPor } : null,
  }
}

export function opcoesConfiguracoes() {
  return {
    redesSociais: REDES_SOCIAIS,
    eventosNotificacao: EVENTOS_NOTIFICACAO,
    provedoresIA: PROVEDORES_IA.map(({ id, rotulo, tipo, baseUrl, modelo, requerChave, ajuda }) => ({
      id,
      rotulo,
      tipo,
      baseUrl,
      modelo,
      requerChave,
      ajuda,
    })),
    anoAtual: ANO_ATUAL,
  }
}
