/**
 * Catálogo único de códigos de erro.
 *
 * Backend e frontend importam este arquivo. Use sempre o código como contrato
 * estável; a mensagem pode ser ajustada sem quebrar testes ou tratamentos.
 */
export const CODIGOS_ERRO = Object.freeze({
  NAO_ENCONTRADO: 'nao_encontrado',
  NAO_IMPLEMENTADO: 'nao_implementado',
  VALIDACAO: 'validacao',
  NAO_AUTORIZADO: 'nao_autorizado',
  CREDENCIAIS_INVALIDAS: 'credenciais_invalidas',
  SEM_PERMISSAO: 'sem_permissao',
  LIMITE_EXCEDIDO: 'limite_excedido',
  JSON_INVALIDO: 'json_invalido',
  CORPO_MUITO_GRANDE: 'corpo_muito_grande',
  ERRO_INTERNO: 'erro_interno',
  OFFLINE: 'offline',
  TIMEOUT: 'timeout',
  HTTP_ERROR: 'http_error',
  DESCONHECIDO: 'desconhecido',
  CONFIGURACAO_DESCONHECIDA: 'configuracao_desconhecida',
  IA_SEM_CHAVE: 'ia_sem_chave',
  IA_URL_INVALIDA: 'ia_url_invalida',
  IA_MODELO_AUSENTE: 'ia_modelo_ausente',
  IA_RESPOSTA_VAZIA: 'ia_resposta_vazia',
  IA_JSON_INVALIDO: 'ia_json_invalido',
  IA_HTTP_ERRO: 'ia_http_erro',
  IA_TIMEOUT: 'ia_timeout',
  IA_SETOR_INVALIDO: 'ia_setor_invalido',
  IA_CONFIANCA_INVALIDA: 'ia_confianca_invalida',
  SMTP_NAO_CONFIGURADO: 'smtp_nao_configurado',
  SMTP_DESTINATARIO_INVALIDO: 'smtp_destinatario_invalido',
  SMTP_FALHOU: 'smtp_falhou',
  IMAGEM_INVALIDA: 'imagem_invalida',
})

export const CATALOGO_ERROS = Object.freeze({
  [CODIGOS_ERRO.NAO_ENCONTRADO]: {
    status: 404,
    titulo: 'Não encontrado',
    mensagem: 'O recurso solicitado não foi encontrado.',
  },
  [CODIGOS_ERRO.NAO_IMPLEMENTADO]: {
    status: 501,
    titulo: 'Não disponível',
    mensagem: 'Esta funcionalidade ainda não está disponível.',
  },
  [CODIGOS_ERRO.VALIDACAO]: {
    status: 422,
    titulo: 'Revise os dados',
    mensagem: 'Dados inválidos.',
  },
  [CODIGOS_ERRO.NAO_AUTORIZADO]: {
    status: 401,
    titulo: 'Sessão expirada',
    mensagem: 'Sessão ausente ou expirada. Entre novamente.',
  },
  [CODIGOS_ERRO.CREDENCIAIS_INVALIDAS]: {
    status: 401,
    titulo: 'Acesso negado',
    mensagem: 'E-mail ou senha inválidos.',
  },
  [CODIGOS_ERRO.SEM_PERMISSAO]: {
    status: 403,
    titulo: 'Sem permissão',
    mensagem: 'Sua conta não tem permissão para executar esta ação.',
  },
  [CODIGOS_ERRO.LIMITE_EXCEDIDO]: {
    status: 429,
    titulo: 'Muitas tentativas',
    mensagem: 'Muitas solicitações em sequência. Aguarde um minuto e tente novamente.',
  },
  [CODIGOS_ERRO.JSON_INVALIDO]: {
    status: 400,
    titulo: 'Requisição inválida',
    mensagem: 'O corpo da requisição não é um JSON válido.',
  },
  [CODIGOS_ERRO.CORPO_MUITO_GRANDE]: {
    status: 413,
    titulo: 'Conteúdo muito grande',
    mensagem: 'O conteúdo enviado excede o limite permitido.',
  },
  [CODIGOS_ERRO.ERRO_INTERNO]: {
    status: 500,
    titulo: 'Erro inesperado',
    mensagem: 'Erro inesperado no servidor.',
  },
  [CODIGOS_ERRO.OFFLINE]: {
    status: 0,
    titulo: 'Sem conexão',
    mensagem: 'Sem conexão com a internet. Verifique sua rede e tente novamente.',
  },
  [CODIGOS_ERRO.TIMEOUT]: {
    status: 0,
    titulo: 'Tempo esgotado',
    mensagem: 'O serviço demorou para responder. Tente novamente em instantes.',
  },
  [CODIGOS_ERRO.HTTP_ERROR]: {
    status: 0,
    titulo: 'Não foi possível concluir',
    mensagem: 'Não foi possível concluir a operação.',
  },
  [CODIGOS_ERRO.DESCONHECIDO]: {
    status: 0,
    titulo: 'Não foi possível concluir',
    mensagem: 'Ocorreu um erro desconhecido.',
  },
  [CODIGOS_ERRO.CONFIGURACAO_DESCONHECIDA]: {
    status: 404,
    titulo: 'Configuração não encontrada',
    mensagem: 'Seção de configuração desconhecida.',
  },
  [CODIGOS_ERRO.IA_SEM_CHAVE]: {
    status: 422,
    titulo: 'Chave ausente',
    mensagem: 'Informe a chave de API para testar este provedor.',
  },
  [CODIGOS_ERRO.IA_URL_INVALIDA]: {
    status: 422,
    titulo: 'URL inválida',
    mensagem: 'Informe uma URL http(s) válida para o endpoint do modelo.',
  },
  [CODIGOS_ERRO.IA_MODELO_AUSENTE]: {
    status: 422,
    titulo: 'Modelo ausente',
    mensagem: 'Informe o modelo de IA antes de classificar.',
  },
  [CODIGOS_ERRO.IA_RESPOSTA_VAZIA]: {
    status: 502,
    titulo: 'Resposta vazia',
    mensagem: 'O modelo respondeu sem conteúdo.',
  },
  [CODIGOS_ERRO.IA_JSON_INVALIDO]: {
    status: 502,
    titulo: 'Resposta inválida',
    mensagem: 'O modelo não retornou um JSON válido.',
  },
  [CODIGOS_ERRO.IA_HTTP_ERRO]: {
    status: 502,
    titulo: 'Falha no provedor',
    mensagem: 'O provedor de IA respondeu com erro.',
  },
  [CODIGOS_ERRO.IA_TIMEOUT]: {
    status: 504,
    titulo: 'Tempo esgotado',
    mensagem: 'O modelo não respondeu dentro do tempo limite.',
  },
  [CODIGOS_ERRO.IA_SETOR_INVALIDO]: {
    status: 502,
    titulo: 'Classificação inválida',
    mensagem: 'O modelo indicou um setor desconhecido ou fora da lista permitida.',
  },
  [CODIGOS_ERRO.IA_CONFIANCA_INVALIDA]: {
    status: 502,
    titulo: 'Classificação inválida',
    mensagem: 'O modelo não retornou uma confiança numérica válida.',
  },
  [CODIGOS_ERRO.SMTP_NAO_CONFIGURADO]: {
    status: 422,
    titulo: 'SMTP incompleto',
    mensagem: 'Configure o servidor SMTP e o remetente antes de enviar.',
  },
  [CODIGOS_ERRO.SMTP_DESTINATARIO_INVALIDO]: {
    status: 422,
    titulo: 'Destinatário inválido',
    mensagem: 'Informe um destinatário de teste válido.',
  },
  [CODIGOS_ERRO.SMTP_FALHOU]: {
    status: 502,
    titulo: 'Falha no envio',
    mensagem: 'Não foi possível enviar o e-mail.',
  },
  [CODIGOS_ERRO.IMAGEM_INVALIDA]: {
    status: 0,
    titulo: 'Imagem inválida',
    mensagem: 'Não foi possível preparar a imagem. Escolha outro arquivo.',
  },
})

export function definicaoErro(codigo) {
  return CATALOGO_ERROS[codigo] ?? CATALOGO_ERROS[CODIGOS_ERRO.DESCONHECIDO]
}

export function statusDoErro(codigo) {
  return definicaoErro(codigo).status || 500
}

export function mensagemDoErro(codigo, mensagem) {
  return mensagem || definicaoErro(codigo).mensagem
}

export function corpoErro(codigo, { mensagem, campos } = {}) {
  return {
    erro: {
      codigo,
      mensagem: mensagemDoErro(codigo, mensagem),
      ...(campos && Object.keys(campos).length > 0 ? { campos } : {}),
    },
  }
}
