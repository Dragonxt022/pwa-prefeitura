/**
 * Tokens de recuperação de senha.
 *
 * O código enviado por e-mail nunca é persistido: guardamos apenas o hash
 * SHA-256, a validade de 30 minutos e o uso único. Um novo pedido invalida os
 * tokens anteriores do mesmo cidadão.
 */
import { estado, persistir } from './estado.js'
import { mysqlConfigurado } from './mysql.js'
import {
  inserirRecuperacaoSenha,
  marcarRecuperacaoUsada,
  removerRecuperacoesDoCidadao,
} from './mysql-dados.js'

function clonar(registro) {
  return registro ? structuredClone(registro) : null
}

export function buscarPorTokenHash(tokenHash) {
  return clonar(
    estado.recuperacoesSenha.find((registro) => registro.tokenHash === tokenHash),
  )
}

export async function criar(registro) {
  await removerDoCidadao(registro.cidadaoId)
  const salvo = {
    ...structuredClone(registro),
    id: registro.id || `recuperacao-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }
  if (mysqlConfigurado) {
    salvo.id = await inserirRecuperacaoSenha(salvo)
  }
  estado.recuperacoesSenha.push(salvo)
  if (!mysqlConfigurado) persistir()
  return clonar(salvo)
}

export async function marcarUsado(id, usadoEm) {
  const registro = estado.recuperacoesSenha.find((item) => item.id === id)
  if (!registro) return false
  registro.usadoEm = usadoEm
  if (mysqlConfigurado) {
    await marcarRecuperacaoUsada(id, usadoEm)
  } else {
    persistir()
  }
  return true
}

export async function removerDoCidadao(cidadaoId) {
  const removidos = estado.recuperacoesSenha.filter(
    (item) => item.cidadaoId === cidadaoId,
  )
  estado.recuperacoesSenha = estado.recuperacoesSenha.filter(
    (item) => item.cidadaoId !== cidadaoId,
  )
  if (mysqlConfigurado) {
    await removerRecuperacoesDoCidadao(cidadaoId)
  } else if (removidos.length > 0) {
    persistir()
  }
  return removidos.length
}
