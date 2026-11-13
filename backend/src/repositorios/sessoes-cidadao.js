/**
 * Repositório de sessões do cidadão.
 *
 * Assim como na gestão, o token opaco fica apenas no cookie; o banco guarda o
 * hash SHA-256. A sessão do cidadão é separada da sessão administrativa.
 */
import { estado, persistir } from './estado.js'
import { mysqlConfigurado } from './mysql.js'
import {
  inserirSessaoCidadao,
  removerSessaoCidadao,
  removerSessoesDoCidadao,
} from './mysql-dados.js'

function clonar(sessao) {
  return sessao ? structuredClone(sessao) : null
}

export async function criar(sessao) {
  if (!sessao) return null
  const salva = structuredClone(sessao)
  estado.sessoesCidadao.push(salva)
  try {
    if (mysqlConfigurado) {
      await inserirSessaoCidadao(salva)
    } else {
      persistir()
    }
  } catch (erro) {
    const indice = estado.sessoesCidadao.indexOf(salva)
    if (indice >= 0) estado.sessoesCidadao.splice(indice, 1)
    throw erro
  }
  return clonar(salva)
}

export function buscarPorTokenHash(tokenHash) {
  return clonar(
    estado.sessoesCidadao.find((sessao) => sessao.tokenHash === tokenHash),
  )
}

export async function removerPorTokenHash(tokenHash) {
  if (!tokenHash) return false
  const removidas = []
  for (let indice = estado.sessoesCidadao.length - 1; indice >= 0; indice -= 1) {
    if (estado.sessoesCidadao[indice].tokenHash === tokenHash) {
      removidas.push(estado.sessoesCidadao[indice])
      estado.sessoesCidadao.splice(indice, 1)
    }
  }
  if (removidas.length === 0) return false

  try {
    if (mysqlConfigurado) {
      await removerSessaoCidadao(tokenHash)
    } else {
      persistir()
    }
  } catch (erro) {
    estado.sessoesCidadao.push(...removidas)
    throw erro
  }
  return true
}

export async function removerDoCidadao(cidadaoId) {
  const removidas = estado.sessoesCidadao.filter(
    (sessao) => sessao.cidadaoId === cidadaoId,
  )
  if (removidas.length === 0) return 0
  estado.sessoesCidadao = estado.sessoesCidadao.filter(
    (sessao) => sessao.cidadaoId !== cidadaoId,
  )
  try {
    if (mysqlConfigurado) {
      await removerSessoesDoCidadao(cidadaoId)
    } else {
      persistir()
    }
  } catch (erro) {
    estado.sessoesCidadao.push(...removidas)
    throw erro
  }
  return removidas.length
}
