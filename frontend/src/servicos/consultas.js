const CHAVE_CONSULTAS = 'prefeitura:consultas'
const CHAVE_ULTIMO = 'prefeitura:ultimo-protocolo'
const CHAVE_PEDIDOS = 'prefeitura:pedidos'
const CHAVE_NOTIFICACOES = 'prefeitura:notificacoes'
const LIMITE_CONSULTAS = 5
const LIMITE_PEDIDOS = 20
const LIMITE_NOTIFICACOES = 30

function ler(chave, padrao) {
  try {
    const bruto = JSON.parse(localStorage.getItem(chave) ?? 'null')
    return bruto ?? padrao
  } catch {
    return padrao
  }
}

function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // Armazenamento indisponível (modo privado): seguir sem persistir.
  }
}

export function listarConsultas() {
  const bruto = ler(CHAVE_CONSULTAS, [])
  return Array.isArray(bruto) ? bruto.filter((item) => item?.protocolo) : []
}

export function registrarConsulta(protocolo) {
  const registros = listarConsultas().filter((item) => item.protocolo !== protocolo)
  const atualizados = [{ protocolo, em: new Date().toISOString() }, ...registros].slice(
    0,
    LIMITE_CONSULTAS,
  )

  salvar(CHAVE_CONSULTAS, atualizados)
  try {
    localStorage.setItem(CHAVE_ULTIMO, protocolo)
  } catch {
    // ignorar
  }

  return atualizados
}

export function ultimoProtocolo() {
  try {
    return localStorage.getItem(CHAVE_ULTIMO)
  } catch {
    return null
  }
}

export function listarPedidos() {
  const bruto = ler(CHAVE_PEDIDOS, [])
  if (!Array.isArray(bruto)) return []
  return bruto
    .filter((item) => item?.protocolo)
    .sort((a, b) => new Date(b.criadoEm || 0).getTime() - new Date(a.criadoEm || 0).getTime())
}

function resumoPedido(dados) {
  return {
    protocolo: dados.protocolo,
    tipo: dados.tipo,
    tipoTitulo: dados.tipoTitulo,
    endereco: dados.endereco,
    status: dados.status,
    criadoEm: dados.criadoEm,
    atualizadoEm: dados.atualizadoEm,
    slaEm: dados.slaEm,
    prazoDias: dados.prazoDias,
    avaliacao: dados.avaliacao ?? null,
  }
}

export function registrarPedido(dados, codigoAcesso) {
  if (!dados?.protocolo) return listarPedidos()
  const atual = listarPedidos()
  const anterior = atual.find((item) => item.protocolo === dados.protocolo)
  const resumo = {
    ...resumoPedido(dados),
    // O código é guardado junto ao pedido para permitir reabrir e atualizar o
    // status sem pedir o segredo novamente. Pedidos antigos podem não ter.
    codigoAcesso: codigoAcesso || anterior?.codigoAcesso || dados.codigoAcesso || null,
    // Mantém a data em que o cidadão viu a atualização pela última vez.
    // Um pedido recém-criado já nasce "visto" para não gerar um falso aviso.
    vistoEm: anterior?.vistoEm ?? dados.atualizadoEm ?? null,
  }
  const atualizados = [resumo, ...atual.filter((item) => item.protocolo !== dados.protocolo)].slice(
    0,
    LIMITE_PEDIDOS,
  )
  salvar(CHAVE_PEDIDOS, atualizados)
  return atualizados
}

export function atualizarPedido(dados) {
  if (!dados?.protocolo) return null
  const atual = listarPedidos()
  const anterior = atual.find((item) => item.protocolo === dados.protocolo)
  if (!anterior) return null

  const resumo = {
    ...anterior,
    ...resumoPedido(dados),
  }
  salvar(
    CHAVE_PEDIDOS,
    [resumo, ...atual.filter((item) => item.protocolo !== dados.protocolo)].slice(0, LIMITE_PEDIDOS),
  )
  return resumo
}

export function marcarPedidoVisto(protocolo) {
  const atual = listarPedidos()
  const atualizados = atual.map((item) =>
    item.protocolo === protocolo ? { ...item, vistoEm: item.atualizadoEm ?? new Date().toISOString() } : item,
  )
  salvar(CHAVE_PEDIDOS, atualizados)
  return atualizados
}

export function listarNotificacoes() {
  const bruto = ler(CHAVE_NOTIFICACOES, [])
  return Array.isArray(bruto) ? bruto.filter((item) => item?.id) : []
}

export function adicionarNotificacao(notificacao) {
  if (!notificacao?.id) return listarNotificacoes()
  const atual = listarNotificacoes().filter((item) => item.id !== notificacao.id)
  const atualizadas = [notificacao, ...atual].slice(0, LIMITE_NOTIFICACOES)
  salvar(CHAVE_NOTIFICACOES, atualizadas)
  return atualizadas
}

export function contarNotificacoesNaoLidas() {
  return listarNotificacoes().filter((item) => !item.lida).length
}

export function marcarNotificacoesLidas() {
  const atualizadas = listarNotificacoes().map((item) => ({ ...item, lida: true }))
  salvar(CHAVE_NOTIFICACOES, atualizadas)
  return atualizadas
}

export function limparDadosLocais() {
  for (const chave of [
    CHAVE_CONSULTAS,
    CHAVE_ULTIMO,
    CHAVE_PEDIDOS,
    CHAVE_NOTIFICACOES,
    'prefeitura:rascunho',
    'prefeitura:fila',
    'prefeitura:fila-enviada',
  ]) {
    try {
      localStorage.removeItem(chave)
    } catch {
      // ignorar
    }
  }
}
