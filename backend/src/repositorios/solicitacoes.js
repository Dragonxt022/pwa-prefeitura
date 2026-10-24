/**
 * Repositório de solicitações.
 *
 * Concentra o acesso ao array em memória e a persistência. Os serviços recebem
 * cópias e devolvem o objeto atualizado por meio de `salvar`, evitando que
 * referências internas do estado sejam mutadas fora desta camada.
 */
import { estado, persistir } from './estado.js'

function clonar(item) {
  return item ? structuredClone(item) : null
}

export function listarTodas() {
  return estado.solicitacoes.map(clonar)
}

export function buscar(protocolo) {
  const alvo = String(protocolo ?? '').toUpperCase().trim()
  return clonar(estado.solicitacoes.find((item) => item.protocolo === alvo))
}

export function buscarPorClientId(clientId) {
  if (!clientId) return null
  return clonar(estado.solicitacoes.find((item) => item.clientId === clientId))
}

export function proximaSequencia() {
  estado.sequencia += 1
  return estado.sequencia
}

export function adicionar(solicitacao) {
  if (!solicitacao) return null
  const salva = structuredClone(solicitacao)
  estado.solicitacoes.unshift(salva)
  persistir()
  return clonar(salva)
}

export function salvar(solicitacao) {
  if (!solicitacao?.protocolo) return null
  const indice = estado.solicitacoes.findIndex(
    (item) => item.protocolo === solicitacao.protocolo,
  )
  if (indice < 0) return null
  estado.solicitacoes[indice] = structuredClone(solicitacao)
  persistir()
  return clonar(estado.solicitacoes[indice])
}
