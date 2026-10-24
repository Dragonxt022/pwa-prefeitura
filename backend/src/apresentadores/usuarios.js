/**
 * Contrato público de usuário.
 *
 * Remove `senhaHash` e demais campos internos antes de qualquer resposta HTTP.
 */
import { setorPublico } from '../dominio/catalogo.js'

export function usuarioPublico(usuario) {
  if (!usuario) return null
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    setorId: usuario.setorId,
    setor: setorPublico(usuario.setorId),
    ativo: usuario.ativo,
  }
}
