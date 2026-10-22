const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(mensagem, { status = 0, codigo = 'desconhecido', campos, offline = false } = {}) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo
    this.campos = campos
    this.offline = offline
  }
}

const SEM_CONEXAO = 'Sem conexão com a internet. Verifique sua rede e tente novamente.'

async function requisicao(caminho, { metodo = 'GET', corpo, timeout = 8000, signal } = {}) {
  // Escritas não podem ser respondidas pelo cache do Service Worker.
  if (metodo !== 'GET' && !navigator.onLine) {
    throw new ApiError(SEM_CONEXAO, { codigo: 'offline', offline: true })
  }

  const controller = new AbortController()
  const cancelar = () => controller.abort()
  signal?.addEventListener('abort', cancelar)
  const timer = setTimeout(cancelar, timeout)

  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: controller.signal,
    })

    const tipo = resposta.headers.get('content-type') || ''
    const payload = tipo.includes('application/json') ? await resposta.json().catch(() => null) : null

    if (!resposta.ok) {
      const erro = payload?.erro
      throw new ApiError(erro?.mensagem || `Não foi possível concluir a operação (${resposta.status}).`, {
        status: resposta.status,
        codigo: erro?.codigo || 'http_error',
        campos: erro?.campos,
      })
    }

    return payload?.dados ?? payload
  } catch (erro) {
    if (erro instanceof ApiError) throw erro

    if (erro?.name === 'AbortError') {
      throw new ApiError('O serviço demorou para responder. Tente novamente em instantes.', {
        codigo: 'timeout',
        offline: !navigator.onLine,
      })
    }

    throw new ApiError(SEM_CONEXAO, { codigo: 'offline', offline: true })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancelar)
  }
}

export const listarServicos = () => requisicao('/servicos')

export const listarAvisos = () => requisicao('/avisos')

export const obterPerfil = () => requisicao('/perfil')

export const consultarSolicitacao = (protocolo) =>
  requisicao(`/solicitacoes/${encodeURIComponent(protocolo)}`)

export const criarSolicitacao = (dados) =>
  requisicao('/solicitacoes', { metodo: 'POST', corpo: dados, timeout: 15000 })
