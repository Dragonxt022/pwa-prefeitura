/**
 * Controllers dos avisos no painel.
 *
 * Qualquer usuário autenticado pode ler; criação e edição são restritas a
 * administradores pelo middleware da rota.
 */
import { naoEncontrado, validacao } from '../../utils/erros.js'
import {
  atualizarAviso,
  criarAviso,
  listarAuditoriaAvisos,
  obterAvisos,
} from '../../servicos/avisos.js'
import {
  validarAtualizacaoAviso,
  validarCriacaoAviso,
} from '../../validadores/avisos.js'

function responder(res, resultado, status = 200) {
  if (resultado.naoEncontrado) {
    throw naoEncontrado('Aviso não encontrado.')
  }
  if (resultado.campos) {
    throw validacao(resultado.campos, 'Revise os dados do aviso.')
  }
  res.status(status).json({ dados: resultado.registro })
}

export async function listar(_req, res) {
  const [dados, auditoria] = await Promise.all([
    Promise.resolve(obterAvisos()),
    listarAuditoriaAvisos(),
  ])
  res.json({ dados: { ...dados, auditoria } })
}

export async function criarAdmin(req, res) {
  const dados = validarCriacaoAviso(req.body)
  responder(res, await criarAviso(dados, req.usuario), 201)
}

export async function atualizarAdmin(req, res) {
  const dados = validarAtualizacaoAviso(req.body)
  responder(res, await atualizarAviso(req.params.id, dados, req.usuario))
}
