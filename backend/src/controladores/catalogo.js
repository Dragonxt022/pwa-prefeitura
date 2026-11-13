/**
 * Controllers do catálogo público.
 *
 * São leituras estáticas do domínio, sem regra de negócio mutável.
 */
import * as catalogo from '../dominio/catalogo.js'

export function listarServicos(_req, res) {
  // O contrato público mantém apenas os campos de apresentação. Vínculo com o
  // setor, situação e timestamps são internos do catálogo administrativo.
  const dados = catalogo.listarServicos().map(
    ({ ativo: _ativo, setorId: _setorId, criadoEm: _criadoEm, atualizadoEm: _atualizadoEm, ...servico }) =>
      servico,
  )
  res.json({ dados })
}

export function listarAvisos(_req, res) {
  res.json({ dados: catalogo.listarAvisos() })
}

export function obterPerfil(_req, res) {
  res.json({ dados: catalogo.perfil })
}
