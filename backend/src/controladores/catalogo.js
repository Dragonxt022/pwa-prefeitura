/**
 * Controllers do catálogo público.
 *
 * São leituras estáticas do domínio, sem regra de negócio mutável.
 */
import * as catalogo from '../dominio/catalogo.js'

export function listarServicos(_req, res) {
  res.json({ dados: catalogo.listarServicos() })
}

export function listarAvisos(_req, res) {
  res.json({ dados: catalogo.listarAvisos() })
}

export function obterPerfil(_req, res) {
  res.json({ dados: catalogo.perfil })
}
