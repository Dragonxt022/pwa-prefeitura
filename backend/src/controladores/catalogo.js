/**
 * Controllers do catálogo público.
 *
 * São leituras estáticas do domínio, sem regra de negócio mutável.
 */
import * as catalogo from '../dominio/catalogo.js'
import {
  buscarAvisoPublico,
  contarVisualizacao,
  listarAvisos as listarAvisosDominio,
} from '../dominio/avisos.js'
import { registrarVisualizacaoPersistente } from '../servicos/avisos.js'
import { naoEncontrado } from '../utils/erros.js'

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
  // Contrato público: sem os campos internos do painel (situação e timestamps).
  const dados = listarAvisosDominio().map(
    ({
      ativo: _ativo,
      criadoEm: _criadoEm,
      atualizadoEm: _atualizadoEm,
      desativarAoExpirar: _desativarAoExpirar,
      ...aviso
    }) => aviso,
  )
  res.json({ dados })
}

export function obterAviso(req, res) {
  const publico = buscarAvisoPublico(req.params.id)
  if (!publico) throw naoEncontrado('Aviso não encontrado.')

  const aviso = contarVisualizacao(req.params.id) ?? publico
  void registrarVisualizacaoPersistente(req.params.id)

  // O detalhe mantém o mesmo contrato público da listagem.
  const {
    ativo: _ativo,
    criadoEm: _criadoEm,
    atualizadoEm: _atualizadoEm,
    desativarAoExpirar: _desativarAoExpirar,
    ...dados
  } = aviso
  res.json({ dados })
}

export function obterPerfil(_req, res) {
  res.json({ dados: catalogo.perfil })
}
