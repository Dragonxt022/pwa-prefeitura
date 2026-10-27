/**
 * Regras de negócio das solicitações.
 *
 * Mantém a criação, consulta, mudança de status, transferência, avaliação e
 * estatísticas em um único ponto, independente da camada HTTP.
 */
import * as repositorioSolicitacoes from '../repositorios/solicitacoes.js'
import {
  STATUS,
  STATUS_ABERTOS,
  buscarServico,
  buscarSetor,
  setores,
} from '../dominio/catalogo.js'
import { normalizarSolicitacao } from '../dominio/normalizacao.js'
import { classificarSolicitacao, MODELO_TRIAGEM } from '../dominio/triagem.js'
import {
  codigoAcessoValido,
  normalizarCodigoAcesso,
} from '../../../shared/codigo-acesso.js'
import { adicionarDias } from '../utils/data.js'
import { hashToken, verificarHashToken } from '../utils/seguranca.js'
import { normalizarTexto } from '../utils/texto.js'
import { triagemAutomaticaAtiva } from './configuracoes.js'

export function buscarSolicitacao(protocolo) {
  return repositorioSolicitacoes.buscar(protocolo)
}

export function buscarSolicitacaoPorClientId(clientId) {
  if (!clientId) return null
  return repositorioSolicitacoes.buscarPorClientId(clientId)
}

/** Confere o código informado contra o hash interno, sem expor o hash. */
export function codigoAcessoConfere(solicitacao, codigoAcesso) {
  if (!solicitacao?.codigoAcessoHash) return false
  const normalizado = normalizarCodigoAcesso(codigoAcesso)
  if (!codigoAcessoValido(normalizado)) return false
  return verificarHashToken(normalizado, solicitacao.codigoAcessoHash)
}

export function listarSolicitacoes({ status, tipo, busca, setorId, ids, limite = 100 } = {}) {
  let dados = repositorioSolicitacoes.listarTodas().sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
  )

  if (status) dados = dados.filter((item) => item.status === status)
  if (tipo) dados = dados.filter((item) => item.tipo === tipo)
  if (setorId) dados = dados.filter((item) => item.setorId === setorId)
  if (Array.isArray(ids) && ids.length > 0) {
    const alvos = new Set(ids.map((id) => String(id).toUpperCase()))
    dados = dados.filter((item) => alvos.has(item.protocolo))
  }

  const termo = normalizarTexto(busca)
  if (termo) {
    dados = dados.filter((item) =>
      normalizarTexto(
        `${item.protocolo} ${item.tipoTitulo} ${item.endereco} ${item.descricao} ${buscarSetor(item.setorId)?.nome ?? ''}`,
      ).includes(termo),
    )
  }

  const total = dados.length
  const limiteSeguro = Math.max(1, Math.min(Number(limite) || 100, 500))
  return { dados: dados.slice(0, limiteSeguro), total }
}

export function criarSolicitacao({
  tipo,
  descricao,
  endereco,
  contato,
  foto = null,
  localizacao = null,
  clientId = null,
  codigoAcesso,
  sugestao: sugestaoExterna = null,
}) {
  if (!codigoAcessoValido(codigoAcesso)) {
    throw new Error('Solicitação sem código de acesso válido.')
  }

  const existente = buscarSolicitacaoPorClientId(clientId)
  if (existente) {
    return {
      solicitacao: existente,
      criada: false,
      acessoNegado: !codigoAcessoConfere(existente, codigoAcesso),
    }
  }

  const agora = new Date().toISOString()
  const servico = buscarServico(tipo)
  const sugestao = sugestaoExterna ?? classificarSolicitacao({ tipo, descricao, endereco, setores })
  const automatica = triagemAutomaticaAtiva()
  const setorSugerido = setores.find(
    (setor) => setor.id === sugestao.setorId && !setor.central,
  )
  const setorInicialId = automatica && sugestao.confianca >= 0.5 && setorSugerido
    ? setorSugerido.id
    : 'triagem'
  const sequencia = repositorioSolicitacoes.proximaSequencia()

  const solicitacao = normalizarSolicitacao({
    protocolo: `PREF-${new Date().getFullYear()}-${String(sequencia).padStart(6, '0')}`,
    tipo,
    tipoTitulo: servico.titulo,
    descricao: descricao.trim(),
    endereco: endereco.trim(),
    contato: contato?.trim() || null,
    status: 'recebida',
    criadoEm: agora,
    atualizadoEm: agora,
    prazoDias: servico.prazoDias,
    prioridade: 'normal',
    foto,
    localizacao,
    clientId,
    codigoAcessoHash: hashToken(normalizarCodigoAcesso(codigoAcesso)),
    setorId: setorInicialId,
    transferencias: [],
    triagem: {
      ...sugestao,
      automatica,
      aplicada: automatica,
      setorSugeridoId: sugestao.setorId,
      setorInicialId,
      modelo: sugestao.modelo || MODELO_TRIAGEM,
    },
    historico: [
      { status: 'recebida', em: agora, observacao: 'Solicitação registrada pelo aplicativo.' },
    ],
  })

  const salva = repositorioSolicitacoes.adicionar(solicitacao)
  return { solicitacao: salva, criada: true }
}

export function atualizarStatus(protocolo, { status, observacao, prioridade, porUsuario }) {
  const solicitacao = buscarSolicitacao(protocolo)
  if (!solicitacao) return null

  const agora = new Date().toISOString()
  solicitacao.status = status
  solicitacao.atualizadoEm = agora
  if (prioridade) solicitacao.prioridade = prioridade
  solicitacao.historico.push({
    status,
    em: agora,
    observacao: observacao?.trim() || `Status atualizado para ${STATUS[status]}.`,
    ...(porUsuario ? { por: { id: porUsuario.id, nome: porUsuario.nome } } : {}),
  })
  if (status === 'concluida') solicitacao.concluidoEm = agora
  return repositorioSolicitacoes.salvar(solicitacao)
}

/**
 * A transferência é um evento auditável: o status principal (em análise, em
 * execução etc.) é preservado. O SLA original também é preservado, a menos que
 * o operador marque explicitamente recalcularSla.
 */
export function transferirSolicitacao(protocolo, {
  setorDestinoId,
  motivo,
  tipoDestino,
  recalcularSla = false,
  porUsuario,
}) {
  const solicitacao = buscarSolicitacao(protocolo)
  if (!solicitacao) return { erro: 'nao_encontrada' }

  const destino = buscarSetor(setorDestinoId)
  if (!destino || !destino.ativo) return { erro: 'setor_invalido' }

  const tipoFinal = tipoDestino || solicitacao.tipo
  const servicoFinal = buscarServico(tipoFinal)
  if (!servicoFinal) return { erro: 'servico_invalido' }

  const deSetorId = solicitacao.setorId
  const deTipo = solicitacao.tipo
  const agora = new Date().toISOString()
  const transferencia = {
    deSetorId,
    paraSetorId: destino.id,
    deTipo,
    paraTipo: tipoFinal,
    motivo: String(motivo ?? '').trim(),
    recalculouSla: Boolean(recalcularSla && tipoFinal !== deTipo),
    por: porUsuario ? { id: porUsuario.id, nome: porUsuario.nome } : null,
    em: agora,
  }

  solicitacao.setorId = destino.id
  solicitacao.atualizadoEm = agora
  solicitacao.transferencias.push(transferencia)

  if (tipoFinal !== deTipo) {
    solicitacao.tipo = tipoFinal
    solicitacao.tipoTitulo = servicoFinal.titulo
    if (recalcularSla) {
      solicitacao.prazoDias = servicoFinal.prazoDias
      solicitacao.slaEm = adicionarDias(solicitacao.criadoEm, servicoFinal.prazoDias)
      transferencia.slaRecalculadoEm = solicitacao.slaEm
    }
  }

  solicitacao.historico.push({
    status: solicitacao.status,
    em: agora,
    tipo: 'transferencia',
    observacao: `Transferida de ${buscarSetor(deSetorId)?.nome ?? 'Triagem'} para ${destino.nome}.${motivo ? ` Motivo: ${String(motivo).trim()}` : ''}`,
    ...(porUsuario ? { por: { id: porUsuario.id, nome: porUsuario.nome } } : {}),
  })

  const salva = repositorioSolicitacoes.salvar(solicitacao)
  return { solicitacao: salva, transferencia }
}

export function avaliarSolicitacao(protocolo, { nota, comentario }) {
  const solicitacao = buscarSolicitacao(protocolo)
  if (!solicitacao) return null

  solicitacao.avaliacao = {
    nota,
    comentario: comentario?.trim() || null,
    em: new Date().toISOString(),
  }
  return repositorioSolicitacoes.salvar(solicitacao)
}

export function listarSemelhantes({ tipo, endereco, latitude, longitude }) {
  if (!tipo) return []

  const tokens = normalizarTexto(endereco)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3)
  const lat = Number(latitude)
  const lng = Number(longitude)
  const temCoordenadas = Number.isFinite(lat) && Number.isFinite(lng)

  return repositorioSolicitacoes
    .listarTodas()
    .filter((item) => item.tipo === tipo && STATUS_ABERTOS.includes(item.status))
    .map((item) => {
      const tokensItem = normalizarTexto(item.endereco)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 3)
      const comuns = tokens.filter((token) => tokensItem.includes(token)).length
      const textoParecido =
        Boolean(endereco) &&
        (normalizarTexto(item.endereco).includes(normalizarTexto(endereco)) ||
          normalizarTexto(endereco).includes(normalizarTexto(item.endereco)))

      let distanciaMetros = null
      if (temCoordenadas && item.localizacao) {
        const dLat = (lat - Number(item.localizacao.latitude)) * 111_320
        const dLng =
          (lng - Number(item.localizacao.longitude)) *
          111_320 *
          Math.cos((lat * Math.PI) / 180)
        distanciaMetros = Math.round(Math.sqrt(dLat ** 2 + dLng ** 2))
      }

      const corresponde =
        (tokens.length > 0 && comuns >= 2) ||
        textoParecido ||
        (distanciaMetros !== null && distanciaMetros <= 300)

      return { item, corresponde, distanciaMetros }
    })
    .filter(({ corresponde }) => corresponde)
    .slice(0, 3)
    .map(({ item, distanciaMetros }) => ({
      // A rota é pública: não devolve protocolo, endereço nem qualquer dado
      // que permita abrir o pedido de outra pessoa.
      tipo: item.tipo,
      tipoTitulo: item.tipoTitulo,
      status: item.status,
      distanciaMetros,
    }))
}

export function estatisticasGestao({ setorId } = {}) {
  const todas = repositorioSolicitacoes.listarTodas()
  const base = setorId
    ? todas.filter((item) => item.setorId === setorId)
    : todas
  const agora = Date.now()
  const abertas = base.filter((item) => STATUS_ABERTOS.includes(item.status))
  const atrasadas = abertas.filter((item) => new Date(item.slaEm).getTime() < agora)
  const avaliacoes = base.filter((item) => item.avaliacao?.nota)
  const mediaAvaliacao = avaliacoes.length
    ? avaliacoes.reduce((soma, item) => soma + item.avaliacao.nota, 0) / avaliacoes.length
    : null

  return {
    total: base.length,
    abertas: abertas.length,
    atrasadas: atrasadas.length,
    concluidas: base.filter((item) => item.status === 'concluida').length,
    avaliacoes: avaliacoes.length,
    mediaAvaliacao: mediaAvaliacao ? Number(mediaAvaliacao.toFixed(1)) : null,
  }
}
