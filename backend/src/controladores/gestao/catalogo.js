/**
 * Consultas administrativas do catálogo.
 *
 * A leitura é liberada para qualquer usuário autenticado; a edição virá em
 * uma etapa própria, restrita a administradores.
 */
import { listarSecretarias as listar } from '../../dominio/catalogo.js'

export function listarSecretarias(_req, res) {
  res.json({ dados: listar() })
}
