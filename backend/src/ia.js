/**
 * Adaptadores dos provedores de IA usados na triagem.
 *
 * Todos os provedores precisam devolver o mesmo contrato do classificador por
 * regras: setorId, setorNome, confianca, justificativa, origem e modelo.
 * Chaves de API nunca são incluídas em logs ou respostas.
 */
import {
  CODIGOS_ERRO,
  mensagemDoErro,
} from '../../shared/codigos-erro.js'
import { provedorIA } from './configuracoes.js'
import { classificarSolicitacao, MODELO_TRIAGEM } from './triagem.js'

export class ErroIA extends Error {
  constructor(codigo, mensagem) {
    super(mensagem || mensagemDoErro(codigo))
    this.name = 'ErroIA'
    this.codigo = codigo
  }
}

function falhaIA(codigo, mensagem) {
  return new ErroIA(codigo, mensagem)
}

export const AMOSTRA_QUALIDADE = {
  tipo: 'poda',
  descricao:
    'Árvore com galhos grandes sobre a fiação elétrica em frente à escola municipal. Há risco de queda.',
  endereco: 'Rua das Acácias, 80 - Centro',
}

export const SETOR_ESPERADO_QUALIDADE = 'meio_ambiente'

function normalizarUrl(base, sufixo) {
  const limpo = String(base || '').trim().replace(/\/+$/, '')
  if (!limpo) throw falhaIA(CODIGOS_ERRO.IA_URL_INVALIDA)
  if (limpo.endsWith(sufixo)) return limpo
  return `${limpo}${sufixo}`
}

function setoresPermitidos(setores) {
  return setores
    .filter((setor) => !setor.central && setor.ativo !== false)
    .map((setor) => ({ id: setor.id, nome: setor.nome, servicos: setor.servicos }))
}

function montarPrompt({ tipo, descricao, endereco }, setores) {
  const lista = setoresPermitidos(setores)
  return [
    'Você é o classificador de solicitações urbanas de uma prefeitura.',
    'Escolha exatamente um dos setores permitidos abaixo. Se não houver evidência suficiente, use "triagem".',
    '',
    `Setores permitidos: ${JSON.stringify(lista)}`,
    '',
    'Solicitação:',
    `Tipo escolhido pelo cidadão: ${tipo}`,
    `Descrição: ${descricao}`,
    `Endereço: ${endereco}`,
    '',
    'Responda SOMENTE com um objeto JSON válido, sem markdown, no formato:',
    '{"setorId":"id_permitido","confianca":0.0,"justificativa":"texto curto em português"}',
    'A confiança deve ser um número entre 0 e 1.',
  ].join('\n')
}

function extrairJson(conteudo) {
  if (typeof conteudo !== 'string' || !conteudo.trim()) {
    throw falhaIA(CODIGOS_ERRO.IA_RESPOSTA_VAZIA)
  }
  const limpo = conteudo.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(limpo)
  } catch {
    const inicio = limpo.indexOf('{')
    const fim = limpo.lastIndexOf('}')
    if (inicio >= 0 && fim > inicio) {
      try {
        return JSON.parse(limpo.slice(inicio, fim + 1))
      } catch {
        // Cai no erro amigável abaixo.
      }
    }
  }
  throw falhaIA(
    CODIGOS_ERRO.IA_JSON_INVALIDO,
    'O modelo não retornou um JSON válido. Ajuste o prompt/modelo e teste novamente.',
  )
}

async function lerCorpo(resposta) {
  const tipo = resposta.headers.get('content-type') || ''
  if (tipo.includes('application/json')) {
    return resposta.json().catch(() => null)
  }
  return resposta.text().catch(() => '')
}

async function chamarCompativelOpenAI(config, prompt, setores) {
  const url = normalizarUrl(config.baseUrl, '/chat/completions')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeoutMs)
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.modelo,
        temperature: config.temperatura,
        max_tokens: 400,
        stream: false,
        messages: [
          {
            role: 'system',
            content:
              'Classifique solicitações municipais. Responda apenas JSON válido, sem comentários.',
          },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    })
    const corpo = await lerCorpo(resposta)
    if (!resposta.ok) {
      const detalhe = typeof corpo === 'string' ? corpo.slice(0, 180) : corpo?.error?.message
      throw falhaIA(
        CODIGOS_ERRO.IA_HTTP_ERRO,
        `Provedor respondeu HTTP ${resposta.status}${detalhe ? `: ${detalhe}` : ''}.`,
      )
    }
    const conteudo = corpo?.choices?.[0]?.message?.content
    return extrairJson(
      Array.isArray(conteudo)
        ? conteudo.map((parte) => parte?.text ?? '').join(' ')
        : conteudo,
    )
  } catch (erro) {
    if (erro?.name === 'AbortError') {
      throw falhaIA(CODIGOS_ERRO.IA_TIMEOUT)
    }
    if (erro instanceof ErroIA) throw erro
    throw falhaIA(
      CODIGOS_ERRO.IA_HTTP_ERRO,
      'Não foi possível conectar ao provedor de IA. Verifique a URL e a rede.',
    )
  } finally {
    clearTimeout(timer)
  }
}

async function chamarAnthropic(config, prompt) {
  const url = normalizarUrl(config.baseUrl || 'https://api.anthropic.com', '/v1/messages')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeoutMs)
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.modelo,
        max_tokens: 400,
        temperature: config.temperatura,
        system:
          'Classifique solicitações municipais. Responda apenas JSON válido, sem markdown.',
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })
    const corpo = await lerCorpo(resposta)
    if (!resposta.ok) {
      const detalhe = typeof corpo === 'string' ? corpo.slice(0, 180) : corpo?.error?.message
      throw falhaIA(
        CODIGOS_ERRO.IA_HTTP_ERRO,
        `Provedor respondeu HTTP ${resposta.status}${detalhe ? `: ${detalhe}` : ''}.`,
      )
    }
    const texto = (corpo?.content ?? [])
      .map((parte) => (parte?.type === 'text' ? parte.text : ''))
      .join(' ')
    return extrairJson(texto)
  } catch (erro) {
    if (erro?.name === 'AbortError') {
      throw falhaIA(CODIGOS_ERRO.IA_TIMEOUT)
    }
    if (erro instanceof ErroIA) throw erro
    throw falhaIA(
      CODIGOS_ERRO.IA_HTTP_ERRO,
      'Não foi possível conectar ao provedor de IA. Verifique a URL e a rede.',
    )
  } finally {
    clearTimeout(timer)
  }
}

function validarResposta(conteudo, config, setores, latenciaMs) {
  const setor = setoresPermitidos(setores).find((item) => item.id === conteudo?.setorId)
  if (!setor) {
    throw falhaIA(CODIGOS_ERRO.IA_SETOR_INVALIDO)
  }
  const confianca = Number(conteudo?.confianca)
  if (!Number.isFinite(confianca)) {
    throw falhaIA(CODIGOS_ERRO.IA_CONFIANCA_INVALIDA)
  }
  return {
    setorId: setor.id,
    setorNome: setor.nome,
    confianca: Math.max(0, Math.min(1, confianca)),
    justificativa:
      typeof conteudo?.justificativa === 'string' && conteudo.justificativa.trim()
        ? conteudo.justificativa.trim().slice(0, 300)
        : 'Classificação sugerida pelo modelo.',
    origem: 'modelo',
    modelo: config.modelo,
    provedor: config.provedor,
    latenciaMs,
  }
}

export async function classificarComModelo({ config, solicitacao, setores }) {
  const provedor = provedorIA(config.provedor)
  if (provedor.id === 'regras') {
    return classificarSolicitacao({ ...solicitacao, setores })
  }
  if (!config.modelo) throw falhaIA(CODIGOS_ERRO.IA_MODELO_AUSENTE)
  if (provedor.requerChave && !config.apiKey) {
    throw falhaIA(CODIGOS_ERRO.IA_SEM_CHAVE)
  }
  const prompt = montarPrompt(solicitacao, setores)
  const inicio = Date.now()
  const conteudo = provedor.tipo === 'anthropic'
    ? await chamarAnthropic(config, prompt)
    : await chamarCompativelOpenAI(config, prompt, setores)
  return validarResposta(conteudo, config, setores, Date.now() - inicio)
}

/**
 * Teste de qualidade funcional: usa exatamente a mesma função da triagem com
 * uma amostra conhecida e confere se o setor esperado foi encontrado.
 */
export async function testarModelo(config, setores) {
  const provedor = provedorIA(config.provedor)
  const inicio = Date.now()
  try {
    const resultado = await classificarComModelo({
      config,
      solicitacao: AMOSTRA_QUALIDADE,
      setores,
    })
    const latenciaMs = resultado.latenciaMs ?? Date.now() - inicio
    const ok = resultado.setorId === SETOR_ESPERADO_QUALIDADE && resultado.confianca >= 0.5
    return {
      ok,
      esperado: SETOR_ESPERADO_QUALIDADE,
      obtido: resultado.setorId,
      setorNome: resultado.setorNome,
      confianca: resultado.confianca,
      justificativa: resultado.justificativa,
      latenciaMs,
      modelo: resultado.modelo || MODELO_TRIAGEM,
      provedor: provedor.id,
      mensagem: ok
        ? 'O modelo executou a classificação e encontrou o setor esperado.'
        : 'O modelo respondeu, mas não encontrou o setor esperado com confiança mínima de 50%.',
    }
  } catch (erro) {
    return {
      ok: false,
      codigo: erro?.codigo || CODIGOS_ERRO.IA_HTTP_ERRO,
      esperado: SETOR_ESPERADO_QUALIDADE,
      obtido: null,
      setorNome: null,
      confianca: null,
      latenciaMs: Date.now() - inicio,
      modelo: config.modelo || MODELO_TRIAGEM,
      provedor: provedor.id,
      mensagem: 'O teste não conseguiu concluir a classificação.',
      erro: erro?.message || 'Falha desconhecida ao chamar o modelo.',
    }
  }
}
