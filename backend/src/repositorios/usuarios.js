/**
 * Repositório de usuários.
 *
 * Mantém a consulta e a persistência separadas das regras de autenticação,
 * autorização e montagem do contrato público.
 */
import { estado, persistir } from './estado.js'
import { mysqlConfigurado } from './mysql.js'
import {
  atualizarUsuario,
  inserirUsuario,
} from './mysql-dados.js'

function clonar(usuario) {
  return usuario ? structuredClone(usuario) : null
}

export function listarTodos() {
  return estado.usuarios.map((usuario) => clonar(usuario))
}

export function buscar(id) {
  return clonar(estado.usuarios.find((usuario) => usuario.id === id))
}

export function buscarPorEmail(email) {
  const alvo = String(email ?? '').trim().toLowerCase()
  return clonar(estado.usuarios.find((usuario) => usuario.email === alvo))
}

export function buscarAdminAtivo() {
  return clonar(
    estado.usuarios.find((usuario) => usuario.papel === 'admin' && usuario.ativo),
  )
}

export async function adicionar(usuario) {
  if (!usuario) return null
  const salvo = structuredClone(usuario)
  estado.usuarios.push(salvo)
  try {
    if (mysqlConfigurado) {
      await inserirUsuario(salvo)
    } else {
      persistir()
    }
  } catch (erro) {
    const indice = estado.usuarios.indexOf(salvo)
    if (indice >= 0) estado.usuarios.splice(indice, 1)
    throw erro
  }
  return clonar(salvo)
}

export async function salvar(usuario) {
  if (!usuario?.id) return null
  const indice = estado.usuarios.findIndex((item) => item.id === usuario.id)
  if (indice < 0) return null
  const anterior = estado.usuarios[indice]
  estado.usuarios[indice] = structuredClone(usuario)
  try {
    if (mysqlConfigurado) {
      await atualizarUsuario(usuario)
    } else {
      persistir()
    }
  } catch (erro) {
    estado.usuarios[indice] = anterior
    throw erro
  }
  return clonar(estado.usuarios[indice])
}
