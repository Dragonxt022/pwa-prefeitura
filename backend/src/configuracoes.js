/**
 * Configurações administrativas do piloto.
 *
 * A persistência continua no store JSON. Segredos de SMTP e de IA são
 * armazenados apenas no backend e nunca retornam pela API: a leitura expõe
 * somente indicadores `temSenha`/`temApiKey`.
 */

export const REDES_SOCIAIS = [
  { id: 'instagram', rotulo: 'Instagram' },
  { id: 'youtube', rotulo: 'YouTube' },
  { id: 'facebook', rotulo: 'Facebook' },
  { id: 'x', rotulo: 'X (Twitter)' },
  { id: 'reddit', rotulo: 'Reddit' },
  { id: 'linkedin', rotulo: 'LinkedIn' },
  { id: 'tiktok', rotulo: 'TikTok' },
  { id: 'whatsapp', rotulo: 'WhatsApp' },
  { id: 'site', rotulo: 'Site' },
  { id: 'outro', rotulo: 'Outro' },
]

export const EVENTOS_NOTIFICACAO = [
  {
    id: 'nova_solicitacao',
    rotulo: 'Nova solicitação',
    descricao: 'Quando o cidadão registra um pedido pelo aplicativo.',
    padrao: true,
  },
  {
    id: 'mudanca_status',
    rotulo: 'Mudança de status',
    descricao: 'Quando um pedido muda de fase sem ser concluído ou indeferido.',
    padrao: false,
  },
  {
    id: 'transferencia',
    rotulo: 'Transferência / reclassificação',
    descricao: 'Quando o pedido é encaminhado para outro setor ou serviço.',
    padrao: true,
  },
  {
    id: 'conclusao',
    rotulo: 'Conclusão ou indeferimento',
    descricao: 'Quando o atendimento recebe um status final.',
    padrao: true,
  },
  {
    id: 'avaliacao',
    rotulo: 'Avaliação do cidadão',
    descricao: 'Quando o cidadão avalia um atendimento concluído.',
    padrao: false,
  },
]

export const PROVEDORES_IA = [
  {
    id: 'regras',
    rotulo: 'Regras locais (sem modelo externo)',
    tipo: 'regras',
    baseUrl: '',
    modelo: '',
    requerChave: false,
    ajuda: 'Classificador determinístico do piloto. Não envia dados para fora da prefeitura.',
  },
  {
    id: 'ollama',
    rotulo: 'Ollama (local ou VPS)',
    tipo: 'openai',
    baseUrl: 'http://127.0.0.1:11434/v1',
    modelo: 'llama3.1',
    requerChave: false,
    ajuda: 'Use a URL compatível com OpenAI do Ollama, normalmente terminada em /v1.',
  },
  {
    id: 'openai',
    rotulo: 'OpenAI',
    tipo: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    modelo: 'gpt-4o-mini',
    requerChave: true,
    ajuda: 'Informe a chave de API da organização e um modelo com saída em JSON.',
  },
  {
    id: 'claude',
    rotulo: 'Claude (Anthropic)',
    tipo: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    modelo: 'claude-3-5-haiku-latest',
    requerChave: true,
    ajuda: 'A API da Anthropic usa um formato próprio; a chave fica somente no backend.',
  },
  {
    id: 'deepseek',
    rotulo: 'DeepSeek',
    tipo: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    modelo: 'deepseek-chat',
    requerChave: true,
    ajuda: 'Endpoint compatível com OpenAI; confirme o modelo disponível na sua conta.',
  },
  {
    id: 'local',
    rotulo: 'Modelo local / VPS (OpenAI compatível)',
    tipo: 'openai',
    baseUrl: 'http://127.0.0.1:8000/v1',
    modelo: 'modelo-local',
    requerChave: false,
    ajuda: 'vLLM, LM Studio, LocalAI ou outro servidor com /chat/completions compatível.',
  },
]

const ANO_ATUAL = new Date().getFullYear()
const LIMITE_IMAGEM = 1_500_000

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

function booleano(valor, padrao = false) {
  if (valor === undefined) return padrao
  return valor === true || valor === 1 || ['1', 'true', 'sim', 'on'].includes(String(valor).toLowerCase())
}

function ativaPorVariavel(valor) {
  return ['1', 'true', 'sim', 'on'].includes(String(valor ?? '').toLowerCase())
}

function numero(valor, padrao, { minimo, maximo } = {}) {
  const convertido = Number(valor)
  if (!Number.isFinite(convertido)) return padrao
  if (minimo !== undefined && convertido < minimo) return minimo
  if (maximo !== undefined && convertido > maximo) return maximo
  return convertido
}

function corValida(valor) {
  return /^#[0-9a-f]{6}$/i.test(String(valor ?? ''))
}

function normalizarCor(valor, padrao) {
  return corValida(valor) ? String(valor).toUpperCase() : padrao
}

function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor ?? '').trim())
}

function urlValida(valor) {
  try {
    const url = new URL(String(valor ?? '').trim())
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function imagemValida(valor) {
  if (!valor) return true
  if (typeof valor !== 'string' || valor.length > LIMITE_IMAGEM) return false
  return /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i.test(valor) || /^https?:\/\//i.test(valor)
}

function listaTextos(valor, atual = []) {
  if (!Array.isArray(valor)) return [...atual]
  return valor.map((item) => texto(item)).filter(Boolean).slice(0, 20)
}

function listaEmails(valor, atual = []) {
  return [...new Set(listaTextos(valor, atual).map((item) => item.toLowerCase()))]
}

function provedorPorId(id) {
  return PROVEDORES_IA.find((item) => item.id === id) ?? PROVEDORES_IA[0]
}

function normalizarRedes(valor, atual = []) {
  if (!Array.isArray(valor)) return [...atual]
  return valor
    .map((rede, indice) => ({
      id: texto(rede?.id) || `rede-${indice + 1}`,
      rede: REDES_SOCIAIS.some((opcao) => opcao.id === rede?.rede) ? rede.rede : 'outro',
      rotulo: texto(rede?.rotulo).slice(0, 40),
      url: texto(rede?.url),
    }))
    .filter((rede) => rede.url)
    .slice(0, 20)
}

function normalizarEventos(valor, atual = {}) {
  return Object.fromEntries(
    EVENTOS_NOTIFICACAO.map((evento) => [
      evento.id,
      {
        ativo: booleano(valor?.[evento.id]?.ativo, atual?.[evento.id]?.ativo ?? evento.padrao),
      },
    ]),
  )
}

function normalizarNotificacoes(valor) {
  if (!Array.isArray(valor)) return []
  return valor
    .filter((item) => item && typeof item === 'object')
    .slice(0, 30)
    .map((item, indice) => ({
      id: texto(item.id) || `notificacao-${indice}`,
      evento: texto(item.evento) || 'evento',
      canal: 'email',
      status: ['enviado', 'erro', 'ignorado'].includes(item.status) ? item.status : 'erro',
      destinatarios: Array.isArray(item.destinatarios)
        ? item.destinatarios.map((email) => texto(email)).filter(Boolean).slice(0, 20)
        : [],
      assunto: texto(item.assunto).slice(0, 160),
      protocolo: texto(item.protocolo).slice(0, 40) || null,
      codigo: texto(item.codigo).slice(0, 80) || null,
      erro: texto(item.erro).slice(0, 400) || null,
      em: texto(item.em) || new Date().toISOString(),
    }))
}

export function criarConfiguracoesPadrao() {
  return {
    identidade: {
      nome: 'Prefeitura Digital',
      logo: null,
      icone: null,
      corPrimaria: '#1351B4',
      corSecundaria: '#0F7A55',
      corDestaque: '#D97706',
      telefones: [],
      emails: [],
      redesSociais: [],
      rodape: {
        texto: '© {{anos}} {{nome}}. {{direitos}}',
        anoCriacao: ANO_ATUAL,
        direitos: 'Todos os direitos reservados.',
      },
    },
    email: {
      ativo: false,
      smtp: {
        host: '',
        porta: 587,
        seguro: false,
        usuario: '',
        senha: '',
        remetenteNome: 'Prefeitura Digital',
        remetenteEmail: '',
        responderPara: '',
      },
      destinatarios: [],
      eventos: Object.fromEntries(
        EVENTOS_NOTIFICACAO.map((evento) => [evento.id, { ativo: evento.padrao }]),
      ),
    },
    ia: {
      ativo: false,
      aplicarAutomaticamente: ativaPorVariavel(process.env.TRIAGEM_IA_ATIVA),
      provedor: 'regras',
      modelo: '',
      baseUrl: '',
      apiKey: '',
      temperatura: 0.1,
      timeoutMs: 10_000,
    },
    notificacoes: [],
    atualizadoEm: null,
    atualizadoPor: null,
  }
}

export function normalizarIdentidade(entrada = {}, atual = criarConfiguracoesPadrao().identidade) {
  const rodape = entrada.rodape ?? {}
  return {
    nome: texto(entrada.nome ?? atual.nome).slice(0, 80) || 'Prefeitura Digital',
    logo: entrada.logo === undefined ? atual.logo ?? null : (entrada.logo || null),
    icone: entrada.icone === undefined ? atual.icone ?? null : (entrada.icone || null),
    corPrimaria: normalizarCor(entrada.corPrimaria, atual.corPrimaria),
    corSecundaria: normalizarCor(entrada.corSecundaria, atual.corSecundaria),
    corDestaque: normalizarCor(entrada.corDestaque, atual.corDestaque),
    telefones: listaTextos(entrada.telefones, atual.telefones).map((item) => item.slice(0, 40)),
    emails: listaEmails(entrada.emails, atual.emails).filter(emailValido).slice(0, 20),
    redesSociais: normalizarRedes(entrada.redesSociais, atual.redesSociais),
    rodape: {
      texto:
        texto(rodape.texto ?? atual.rodape?.texto).slice(0, 500) ||
        '© {{anos}} {{nome}}. {{direitos}}',
      anoCriacao: Math.round(
        numero(rodape.anoCriacao, atual.rodape?.anoCriacao ?? ANO_ATUAL, {
          minimo: 1900,
          maximo: ANO_ATUAL + 1,
        }),
      ),
      direitos: texto(rodape.direitos ?? atual.rodape?.direitos).slice(0, 160),
    },
  }
}

export function normalizarEmail(entrada = {}, atual = criarConfiguracoesPadrao().email) {
  const smtp = entrada.smtp ?? {}
  const senhaAtual = atual.smtp?.senha ?? ''
  const removerSenha = smtp.removerSenha === true
  const senhaNova = typeof smtp.senha === 'string' ? smtp.senha : ''
  const senha = removerSenha ? '' : (senhaNova || senhaAtual)
  return {
    ativo: booleano(entrada.ativo, atual.ativo),
    smtp: {
      host: texto(smtp.host ?? atual.smtp?.host).slice(0, 160),
      porta: Math.round(numero(smtp.porta, atual.smtp?.porta ?? 587, { minimo: 1, maximo: 65535 })),
      seguro: booleano(smtp.seguro, atual.smtp?.seguro),
      usuario: texto(smtp.usuario ?? atual.smtp?.usuario).slice(0, 160),
      senha: senha.slice(0, 500),
      remetenteNome: texto(smtp.remetenteNome ?? atual.smtp?.remetenteNome).slice(0, 120),
      remetenteEmail: texto(smtp.remetenteEmail ?? atual.smtp?.remetenteEmail).toLowerCase().slice(0, 160),
      responderPara: texto(smtp.responderPara ?? atual.smtp?.responderPara).toLowerCase().slice(0, 160),
    },
    destinatarios: listaEmails(entrada.destinatarios, atual.destinatarios).filter(emailValido).slice(0, 20),
    eventos: normalizarEventos(entrada.eventos, atual.eventos),
  }
}

export function normalizarIA(entrada = {}, atual = criarConfiguracoesPadrao().ia) {
  const provedor = provedorPorId(texto(entrada.provedor ?? atual.provedor))
  const apiKeyAtual = atual.apiKey ?? ''
  const removerApiKey = entrada.removerApiKey === true
  const apiKeyNova = typeof entrada.apiKey === 'string' ? entrada.apiKey : ''
  return {
    ativo: booleano(entrada.ativo, atual.ativo),
    aplicarAutomaticamente: booleano(
      entrada.aplicarAutomaticamente,
      atual.aplicarAutomaticamente,
    ),
    provedor: provedor.id,
    modelo: texto(entrada.modelo ?? atual.modelo).slice(0, 120) ||
      (provedor.id === 'regras' ? '' : provedor.modelo),
    baseUrl: texto(entrada.baseUrl ?? atual.baseUrl).replace(/\/+$/, '') ||
      (provedor.id === 'regras' ? '' : provedor.baseUrl),
    apiKey: removerApiKey ? '' : (apiKeyNova || apiKeyAtual).slice(0, 500),
    temperatura: Number(
      numero(entrada.temperatura, atual.temperatura ?? 0.1, { minimo: 0, maximo: 1.5 }).toFixed(2),
    ),
    timeoutMs: Math.round(
      numero(entrada.timeoutMs, atual.timeoutMs ?? 10_000, { minimo: 3000, maximo: 30_000 }),
    ),
  }
}

export function normalizarConfiguracoes(salvo = {}) {
  const padrao = criarConfiguracoesPadrao()
  return {
    identidade: normalizarIdentidade(salvo.identidade, padrao.identidade),
    email: normalizarEmail(salvo.email, padrao.email),
    ia: normalizarIA(salvo.ia, padrao.ia),
    notificacoes: normalizarNotificacoes(salvo.notificacoes),
    atualizadoEm: texto(salvo.atualizadoEm) || null,
    atualizadoPor:
      salvo.atualizadoPor && typeof salvo.atualizadoPor === 'object'
        ? {
            id: texto(salvo.atualizadoPor.id) || null,
            nome: texto(salvo.atualizadoPor.nome) || null,
          }
        : null,
  }
}

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
  const provedor = provedorPorId(dados.provedor)

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

export function provedorIA(id) {
  return provedorPorId(id)
}
