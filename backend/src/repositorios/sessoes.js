/**
 * Repositório de sessões.
 *
 * O token opaco nunca é armazenado: o serviço envia apenas o hash. A remoção
 * por hash é usada tanto no logout quanto na expiração.
 */
import { estado, persistir } from './estado.js'

function clonar(sessao) {
  return sessao ? structuredClone(sessao) : null
}

export function criar(sessao) {
  if (!sessao) return null
  const salva = structuredClone(sessao)
  estado.sessoes.push(salva)
  persistir()
  return clonar(salva)
}

export function buscarPorTokenHash(tokenHash) {
  return clonar(estado.sessoes.find((sessao) => sessao.tokenHash === tokenHash))
}

export function removerPorTokenHash(tokenHash) {
  if (!tokenHash) return false
  let removeu = false
  for (let indice = estado.sessoes.length - 1; indice >= 0; indice -= 1) {
    if (estado.sessoes[indice].tokenHash === tokenHash) {
      estado.sessoes.splice(indice, 1)
      removeu = true
    }
  }
  if (removeu) persistir()
  return removeu
}
