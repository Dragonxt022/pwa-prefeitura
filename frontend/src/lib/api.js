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

async function requisicao(
  caminho,
  { metodo = 'GET', corpo, timeout = 8000, signal, cabecalhos, completo = false } = {},
) {
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
        ...cabecalhos,
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

    // A listagem da gestão precisa de dados + total + estatísticas no mesmo objeto.
    return completo ? payload : (payload?.dados ?? payload)
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

export const consultarStatus = (protocolo) =>
  requisicao(`/solicitacoes/${encodeURIComponent(protocolo)}/status`, { timeout: 6000 })

export const criarSolicitacao = (dados) =>
  requisicao('/solicitacoes', { metodo: 'POST', corpo: dados, timeout: 20000 })

export const consultarSemelhantes = ({ tipo, endereco, latitude, longitude }) => {
  const query = new URLSearchParams({ tipo, endereco })
  if (Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
    query.set('latitude', String(latitude))
    query.set('longitude', String(longitude))
  }
  return requisicao(`/solicitacoes/semelhantes?${query.toString()}`, { timeout: 6000 })
}

export const avaliarSolicitacao = (protocolo, dados) =>
  requisicao(`/solicitacoes/${encodeURIComponent(protocolo)}/avaliacao`, {
    metodo: 'POST',
    corpo: dados,
    timeout: 12000,
  })

const comGestao = (token, opcoes = {}) => ({
  ...opcoes,
  cabecalhos: { ...opcoes.cabecalhos, 'x-admin-token': token },
})

export const validarAcessoGestao = (token) =>
  requisicao('/gestao/sessao', comGestao(token))

export const listarGestao = (token, { status, tipo, busca, limite = 100 } = {}) => {
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (tipo) query.set('tipo', tipo)
  if (busca) query.set('busca', busca)
  if (limite) query.set('limite', String(limite))
  return requisicao(
    `/gestao/solicitacoes?${query.toString()}`,
    comGestao(token, { timeout: 12000, completo: true }),
  )
}

export const atualizarStatusGestao = (token, protocolo, dados) =>
  requisicao(
    `/gestao/solicitacoes/${encodeURIComponent(protocolo)}/status`,
    comGestao(token, { metodo: 'PATCH', corpo: dados, timeout: 12000 }),
  )
