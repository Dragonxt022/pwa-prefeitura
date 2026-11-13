/**
 * Repositório de solicitações.
 *
 * A leitura vem do cache em memória, mantido em sincronia com o MySQL. As
 * gravações são aguardadas pelo serviço e desfeitas em memória se o banco
 * rejeitar a operação, evitando divergência entre a resposta HTTP e o estado
 * persistido.
 */
import { estado, persistir } from './estado.js'
import { mysqlConfigurado } from './mysql.js'
import {
  atualizarSolicitacao,
  inserirSolicitacao,
  reservarSequencia,
} from './mysql-dados.js'

function clonar(item) {
  return item ? structuredClone(item) : null
}

export function listarTodas() {
  return estado.solicitacoes.map(clonar)
}

/** Atualiza o cache local depois de uma gravação feita diretamente no banco. */
export function atualizarCache(solicitacao) {
  if (!solicitacao?.protocolo) return
  const indice = estado.solicitacoes.findIndex(
    (item) => item.protocolo === solicitacao.protocolo,
  )
  if (indice >= 0) estado.solicitacoes[indice] = structuredClone(solicitacao)
}

export function buscar(protocolo) {
  const alvo = String(protocolo ?? '').toUpperCase().trim()
  return clonar(estado.solicitacoes.find((item) => item.protocolo === alvo))
}

export function buscarPorClientId(clientId) {
  if (!clientId) return null
  return clonar(estado.solicitacoes.find((item) => item.clientId === clientId))
}

export async function proximaSequencia() {
  if (mysqlConfigurado) {
    const sequencia = await reservarSequencia()
    estado.sequencia = Math.max(estado.sequencia, sequencia)
    return sequencia
  }
  estado.sequencia += 1
  return estado.sequencia
}

export async function adicionar(solicitacao) {
  if (!solicitacao) return null
  const salva = structuredClone(solicitacao)
  estado.solicitacoes.unshift(salva)
  try {
    if (mysqlConfigurado) {
      await inserirSolicitacao(salva)
    } else {
      persistir()
    }
  } catch (erro) {
    const indice = estado.solicitacoes.indexOf(salva)
    if (indice >= 0) estado.solicitacoes.splice(indice, 1)
    throw erro
  }
  return clonar(salva)
}

export async function salvar(solicitacao) {
  if (!solicitacao?.protocolo) return null
  const indice = estado.solicitacoes.findIndex(
    (item) => item.protocolo === solicitacao.protocolo,
  )
  if (indice < 0) return null
  const anterior = estado.solicitacoes[indice]
  estado.solicitacoes[indice] = structuredClone(solicitacao)
  try {
    if (mysqlConfigurado) {
      await atualizarSolicitacao(solicitacao)
    } else {
      persistir()
    }
  } catch (erro) {
    estado.solicitacoes[indice] = anterior
    throw erro
  }
  return clonar(estado.solicitacoes[indice])
}
