/**
 * Repositório de sessões.
 *
 * O token opaco nunca é armazenado: o serviço envia apenas o hash. A remoção
 * por hash é usada tanto no logout quanto na expiração.
 */
import { estado, persistir } from './estado.js'
import { mysqlConfigurado } from './mysql.js'
import {
  inserirSessao,
  removerSessao,
} from './mysql-dados.js'

function clonar(sessao) {
  return sessao ? structuredClone(sessao) : null
}

export async function criar(sessao) {
  if (!sessao) return null
  const salva = structuredClone(sessao)
  estado.sessoes.push(salva)
  try {
    if (mysqlConfigurado) {
      await inserirSessao(salva)
    } else {
      persistir()
    }
  } catch (erro) {
    const indice = estado.sessoes.indexOf(salva)
    if (indice >= 0) estado.sessoes.splice(indice, 1)
    throw erro
  }
  return clonar(salva)
}

export function buscarPorTokenHash(tokenHash) {
  return clonar(estado.sessoes.find((sessao) => sessao.tokenHash === tokenHash))
}

export async function removerPorTokenHash(tokenHash) {
  if (!tokenHash) return false
  const removidas = []
  for (let indice = estado.sessoes.length - 1; indice >= 0; indice -= 1) {
    if (estado.sessoes[indice].tokenHash === tokenHash) {
      removidas.push(estado.sessoes[indice])
      estado.sessoes.splice(indice, 1)
    }
  }
  if (removidas.length === 0) return false

  try {
    if (mysqlConfigurado) {
      await removerSessao(tokenHash)
    } else {
      persistir()
    }
  } catch (erro) {
    estado.sessoes.push(...removidas)
    throw erro
  }
  return true
}
