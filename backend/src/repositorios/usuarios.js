/**
 * Repositório de usuários.
 *
 * Mantém a consulta e a persistência separadas das regras de autenticação,
 * autorização e montagem do contrato público.
 */
import { estado, persistir } from './estado.js'

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

export function adicionar(usuario) {
  if (!usuario) return null
  const salvo = structuredClone(usuario)
  estado.usuarios.push(salvo)
  persistir()
  return clonar(salvo)
}

export function salvar(usuario) {
  if (!usuario?.id) return null
  const indice = estado.usuarios.findIndex((item) => item.id === usuario.id)
  if (indice < 0) return null
  estado.usuarios[indice] = structuredClone(usuario)
  persistir()
  return clonar(estado.usuarios[indice])
}
