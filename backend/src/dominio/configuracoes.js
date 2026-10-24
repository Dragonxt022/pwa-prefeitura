/**
 * Configurações administrativas do piloto.
 *
 * Este módulo concentra o catálogo, os valores padrão e a normalização dos
 * dados. A validação fica em `validadores/configuracoes.js` e os contratos de
 * saída em `apresentadores/configuracoes.js`.
 */
import { booleano, emailValido, texto } from '../utils/texto.js'

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

export {
  ANO_ATUAL,
  corValida,
  imagemValida,
  listaEmails,
  listaTextos,
  normalizarRedes,
  urlValida,
}

export function provedorIA(id) {
  return provedorPorId(id)
}
