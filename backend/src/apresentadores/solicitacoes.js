/**
 * Apresentação das solicitações.
 *
 * Mantém as diferenças entre o contrato público do cidadão e o contrato
 * administrativo, incluindo a proteção de contato, clientId, triagem e motivo
 * interno de transferência.
 */
import { STATUS, STATUS_ABERTOS, setorPublico } from '../dominio/catalogo.js'

function calcularSla(solicitacao) {
  const restanteMs = new Date(solicitacao.slaEm).getTime() - Date.now()
  return {
    slaDiasRestantes: Math.ceil(restanteMs / 86_400_000),
    slaVencido: STATUS_ABERTOS.includes(solicitacao.status) && restanteMs < 0,
  }
}

export function apresentarSolicitacaoGestao(solicitacao) {
  const transferencias = (solicitacao.transferencias ?? []).map((transferencia) => ({
    ...transferencia,
    deSetor: setorPublico(transferencia.deSetorId),
    paraSetor: setorPublico(transferencia.paraSetorId),
  }))
  return {
    ...solicitacao,
    setor: setorPublico(solicitacao.setorId),
    setorNome: setorPublico(solicitacao.setorId)?.nome ?? 'Triagem',
    transferencias,
    transferida: transferencias.length > 0,
    ultimaTransferencia: transferencias.at(-1) ?? null,
    ...calcularSla(solicitacao),
  }
}

export function apresentarSolicitacaoPublica(solicitacao) {
  const transferencias = solicitacao.transferencias ?? []
  // A rota pública nunca devolve contato, identificador idempotente, dados da
  // triagem interna, motivo detalhado de transferência nem o nome de servidores
  // que movimentaram o pedido.
  const {
    clientId: _clientId,
    contato: _contato,
    triagem: _triagem,
    transferencias: _transferencias,
    ...publica
  } = solicitacao
  return {
    ...publica,
    historico: (publica.historico ?? []).map(({ por: _por, ...evento }) => {
      if (evento.tipo !== 'transferencia') return evento
      const transferencia = transferencias.find((item) => item.em === evento.em)
      const destino = setorPublico(transferencia?.paraSetorId)
      return {
        ...evento,
        observacao: destino
          ? `Solicitação encaminhada para ${destino.nome}.`
          : 'Solicitação encaminhada para outro setor.',
      }
    }),
    setor: setorPublico(solicitacao.setorId),
    setorNome: setorPublico(solicitacao.setorId)?.nome ?? null,
    transferida: transferencias.length > 0,
    ...calcularSla(solicitacao),
  }
}

export function apresentarStatusPublico(solicitacao) {
  return {
    protocolo: solicitacao.protocolo,
    status: solicitacao.status,
    statusDescricao: STATUS[solicitacao.status],
    atualizadoEm: solicitacao.atualizadoEm,
    setorNome: setorPublico(solicitacao.setorId)?.nome ?? null,
    transferida: (solicitacao.transferencias ?? []).length > 0,
    slaEm: solicitacao.slaEm,
    slaVencido: STATUS_ABERTOS.includes(solicitacao.status) &&
      new Date(solicitacao.slaEm).getTime() < Date.now(),
    avaliacao: solicitacao.avaliacao,
  }
}
