/**
 * Repositório de cidadãos.
 *
 * A leitura vem do cache em memória; as gravações são aguardadas e desfeitas
 * em memória se o banco falhar, mantendo o contrato HTTP consistente.
 */
import { estado, persistir } from './estado.js'
import { mysqlConfigurado } from './mysql.js'
import {
  atualizarCidadao,
  inserirCidadao,
} from './mysql-dados.js'

function clonar(cidadao) {
  return cidadao ? structuredClone(cidadao) : null
}

export function buscar(id) {
  return clonar(estado.cidadaos.find((cidadao) => cidadao.id === id))
}

export function buscarPorEmail(email) {
  const alvo = String(email ?? '').trim().toLowerCase()
  return clonar(estado.cidadaos.find((cidadao) => cidadao.email === alvo))
}

export async function adicionar(cidadao) {
  if (!cidadao) return null
  const salvo = structuredClone(cidadao)
  estado.cidadaos.push(salvo)
  try {
    if (mysqlConfigurado) {
      await inserirCidadao(salvo)
    } else {
      persistir()
    }
  } catch (erro) {
    const indice = estado.cidadaos.indexOf(salvo)
    if (indice >= 0) estado.cidadaos.splice(indice, 1)
    throw erro
  }
  return clonar(salvo)
}

export async function salvar(cidadao) {
  if (!cidadao?.id) return null
  const indice = estado.cidadaos.findIndex((item) => item.id === cidadao.id)
  if (indice < 0) return null
  const anterior = estado.cidadaos[indice]
  estado.cidadaos[indice] = structuredClone(cidadao)
  try {
    if (mysqlConfigurado) {
      await atualizarCidadao(cidadao)
    } else {
      persistir()
    }
  } catch (erro) {
    estado.cidadaos[indice] = anterior
    throw erro
  }
  return clonar(estado.cidadaos[indice])
}
