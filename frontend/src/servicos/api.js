import { CODIGOS_ERRO, mensagemDoErro } from '../utils/erros.js'

const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(mensagem, { status = 0, codigo = CODIGOS_ERRO.DESCONHECIDO, campos, offline = false } = {}) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo
    this.campos = campos
    this.offline = offline
  }
}

async function requisicao(
  caminho,
  { metodo = 'GET', corpo, timeout = 8000, signal, cabecalhos, completo = false } = {},
) {
  // Escritas não podem ser respondidas pelo cache do Service Worker.
  if (metodo !== 'GET' && !navigator.onLine) {
    throw new ApiError(mensagemDoErro(CODIGOS_ERRO.OFFLINE), {
      codigo: CODIGOS_ERRO.OFFLINE,
      offline: true,
    })
  }

  const controller = new AbortController()
  const cancelar = () => controller.abort()
  signal?.addEventListener('abort', cancelar)
  const timer = setTimeout(cancelar, timeout)

  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      // O cookie HttpOnly da sessão de gestão é enviado pelo navegador.
      credentials: 'include',
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
      const codigo = erro?.codigo || CODIGOS_ERRO.HTTP_ERROR
      throw new ApiError(
        erro?.mensagem || mensagemDoErro(codigo, `Não foi possível concluir a operação (${resposta.status}).`),
        {
          status: resposta.status,
          codigo,
          campos: erro?.campos,
        },
      )
    }

    // A listagem da gestão precisa de dados + total + estatísticas no mesmo objeto.
    return completo ? payload : (payload?.dados ?? payload)
  } catch (erro) {
    if (erro instanceof ApiError) throw erro

    if (erro?.name === 'AbortError') {
      const semRede = !navigator.onLine
      throw new ApiError(mensagemDoErro(CODIGOS_ERRO.TIMEOUT), {
        codigo: semRede ? CODIGOS_ERRO.OFFLINE : CODIGOS_ERRO.TIMEOUT,
        offline: semRede,
      })
    }

    if (!navigator.onLine) {
      throw new ApiError(mensagemDoErro(CODIGOS_ERRO.OFFLINE), {
        codigo: CODIGOS_ERRO.OFFLINE,
        offline: true,
      })
    }

    throw new ApiError(mensagemDoErro(CODIGOS_ERRO.HTTP_ERROR), {
      codigo: CODIGOS_ERRO.HTTP_ERROR,
    })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancelar)
  }
}

export const listarServicos = () => requisicao('/servicos')

export const listarAvisos = () => requisicao('/avisos')

export const obterConfiguracoesPublicas = () => requisicao('/configuracoes', { timeout: 8000 })

export const obterPerfil = () => requisicao('/perfil')

// ---------- cidadão: conta, sessão e perfil ----------

export const obterSessaoCidadao = () => requisicao('/cidadao/sessao', { timeout: 8000 })

export const cadastrarCidadao = (dados) =>
  requisicao('/cidadao/cadastro', { metodo: 'POST', corpo: dados, timeout: 20000 })

export const loginCidadao = (dados) =>
  requisicao('/cidadao/login', { metodo: 'POST', corpo: dados, timeout: 15000 })

export const logoutCidadao = () =>
  requisicao('/cidadao/logout', { metodo: 'POST', timeout: 8000 })

export const atualizarPerfilCidadao = (dados) =>
  requisicao('/cidadao/perfil', { metodo: 'PUT', corpo: dados, timeout: 15000 })

export const solicitarRecuperacaoSenha = (dados) =>
  requisicao('/cidadao/senha/solicitar', { metodo: 'POST', corpo: dados, timeout: 15000 })

export const redefinirSenha = (dados) =>
  requisicao('/cidadao/senha/redefinir', { metodo: 'POST', corpo: dados, timeout: 15000 })

export const listarMinhasSolicitacoes = () =>
  requisicao('/cidadao/solicitacoes', { timeout: 12000, completo: true })

export const consultarMinhaSolicitacao = (protocolo) =>
  requisicao(`/cidadao/solicitacoes/${encodeURIComponent(protocolo)}`, { timeout: 12000 })

export const vincularMinhaSolicitacao = (dados) =>
  requisicao('/cidadao/solicitacoes/vincular', {
    metodo: 'POST',
    corpo: dados,
    timeout: 12000,
  })

export const avaliarMinhaSolicitacao = (protocolo, dados) =>
  requisicao(`/cidadao/solicitacoes/${encodeURIComponent(protocolo)}/avaliacao`, {
    metodo: 'POST',
    corpo: dados,
    timeout: 12000,
  })

export const excluirContaCidadao = (dados) =>
  requisicao('/cidadao/conta', { metodo: 'DELETE', corpo: dados, timeout: 15000 })

export async function baixarDadosCidadao() {
  const resposta = await fetch(`${BASE}/cidadao/dados`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!resposta.ok) {
    const payload = await resposta.json().catch(() => null)
    throw new ApiError(
      payload?.erro?.mensagem || 'Não foi possível exportar seus dados.',
      { status: resposta.status, codigo: payload?.erro?.codigo },
    )
  }
  return resposta.blob()
}

export const consultarFilaTriagem = () =>
  requisicao('/triagem/fila', { timeout: 5000 })

function cabecalhosAcesso(codigoAcesso) {
  return codigoAcesso ? { 'x-codigo-acesso': codigoAcesso } : undefined
}

export const consultarSolicitacao = (protocolo, codigoAcesso) =>
  requisicao(`/solicitacoes/${encodeURIComponent(protocolo)}`, {
    cabecalhos: cabecalhosAcesso(codigoAcesso),
  })

export const consultarStatus = (protocolo, codigoAcesso) =>
  requisicao(`/solicitacoes/${encodeURIComponent(protocolo)}/status`, {
    timeout: 6000,
    cabecalhos: cabecalhosAcesso(codigoAcesso),
  })

export const criarSolicitacao = (dados) =>
  requisicao('/solicitacoes', {
    metodo: 'POST',
    corpo: dados,
    timeout: 20000,
    completo: true,
  })

export const consultarSemelhantes = ({ tipo, endereco, latitude, longitude }) => {
  const query = new URLSearchParams({ tipo, endereco })
  if (Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
    query.set('latitude', String(latitude))
    query.set('longitude', String(longitude))
  }
  return requisicao(`/solicitacoes/semelhantes?${query.toString()}`, { timeout: 6000 })
}

export const avaliarSolicitacao = (protocolo, dados, codigoAcesso) =>
  requisicao(`/solicitacoes/${encodeURIComponent(protocolo)}/avaliacao`, {
    metodo: 'POST',
    corpo: dados,
    timeout: 12000,
    cabecalhos: cabecalhosAcesso(codigoAcesso),
  })

// ---------- gestão: sessão, setores, usuários e fila ----------

export const loginGestao = (dados) =>
  requisicao('/gestao/login', { metodo: 'POST', corpo: dados, timeout: 12000 })

export const logoutGestao = () =>
  requisicao('/gestao/logout', { metodo: 'POST', timeout: 8000 })

export const obterSessaoGestao = () => requisicao('/gestao/sessao', { timeout: 8000 })

export const listarSetoresGestao = () => requisicao('/gestao/setores', { timeout: 8000 })

export const obterCatalogoGestao = () => requisicao('/gestao/catalogo', { timeout: 12000 })

export const criarSecretariaGestao = (dados) =>
  requisicao('/gestao/catalogo/secretarias', { metodo: 'POST', corpo: dados, timeout: 12000 })

export const atualizarSecretariaGestao = (id, dados) =>
  requisicao(`/gestao/catalogo/secretarias/${encodeURIComponent(id)}`, {
    metodo: 'PATCH',
    corpo: dados,
    timeout: 12000,
  })

export const criarSetorGestao = (dados) =>
  requisicao('/gestao/catalogo/setores', { metodo: 'POST', corpo: dados, timeout: 12000 })

export const atualizarSetorGestao = (id, dados) =>
  requisicao(`/gestao/catalogo/setores/${encodeURIComponent(id)}`, {
    metodo: 'PATCH',
    corpo: dados,
    timeout: 12000,
  })

export const criarServicoGestao = (dados) =>
  requisicao('/gestao/catalogo/servicos', { metodo: 'POST', corpo: dados, timeout: 12000 })

export const atualizarServicoGestao = (id, dados) =>
  requisicao(`/gestao/catalogo/servicos/${encodeURIComponent(id)}`, {
    metodo: 'PATCH',
    corpo: dados,
    timeout: 12000,
  })

export const listarUsuariosGestao = () => requisicao('/gestao/usuarios', { timeout: 10000 })

export const gerarLinkRecuperacaoGestao = (dados) =>
  requisicao('/gestao/cidadaos/recuperacao', {
    metodo: 'POST',
    corpo: dados,
    timeout: 15000,
  })

export const criarUsuarioGestao = (dados) =>
  requisicao('/gestao/usuarios', { metodo: 'POST', corpo: dados, timeout: 12000 })

export const atualizarUsuarioGestao = (id, dados) =>
  requisicao(`/gestao/usuarios/${encodeURIComponent(id)}`, {
    metodo: 'PATCH',
    corpo: dados,
    timeout: 12000,
  })

export const obterConfiguracoesGestao = () =>
  requisicao('/gestao/configuracoes', { timeout: 12000, completo: true })

export const salvarConfiguracoesGestao = (secao, dados) =>
  requisicao(`/gestao/configuracoes/${encodeURIComponent(secao)}`, {
    metodo: 'PUT',
    corpo: dados,
    timeout: 15000,
  })

export const testarEmailGestao = (dados) =>
  requisicao('/gestao/configuracoes/email/teste', {
    metodo: 'POST',
    corpo: dados,
    timeout: 25000,
  })

export const testarIAConfiguracaoGestao = (dados) =>
  requisicao('/gestao/configuracoes/ia/teste', {
    metodo: 'POST',
    corpo: dados,
    timeout: 35000,
  })

export const listarGestao = ({ status, tipo, busca, setor, ids, limite = 100 } = {}) => {
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (tipo) query.set('tipo', tipo)
  if (busca) query.set('busca', busca)
  if (setor) query.set('setor', setor)
  if (Array.isArray(ids) && ids.length > 0) query.set('ids', ids.join(','))
  if (limite) query.set('limite', String(limite))
  return requisicao(`/gestao/solicitacoes?${query.toString()}`, {
    timeout: 12000,
    completo: true,
  })
}

export const atualizarStatusGestao = (protocolo, dados) =>
  requisicao(`/gestao/solicitacoes/${encodeURIComponent(protocolo)}/status`, {
    metodo: 'PATCH',
    corpo: dados,
    timeout: 12000,
  })

export const transferirGestao = (protocolo, dados) =>
  requisicao(`/gestao/solicitacoes/${encodeURIComponent(protocolo)}/transferir`, {
    metodo: 'PATCH',
    corpo: dados,
    timeout: 12000,
  })
