/**
 * Controllers do catálogo administrativo.
 *
 * Qualquer usuário autenticado pode ler. Criação e edição são restritas a
 * administradores pelo middleware da rota. As regras ficam no serviço; aqui
 * apenas traduzimos o resultado para o contrato HTTP.
 */
import { listarSecretarias as listarSecretariasAtivas } from '../../dominio/catalogo.js'
import { naoEncontrado, validacao } from '../../utils/erros.js'
import {
  atualizarSecretaria,
  atualizarServico,
  atualizarSetor,
  criarSecretaria,
  criarServico,
  criarSetor,
  listarAuditoriaCatalogo,
  obterCatalogo,
} from '../../servicos/catalogo.js'
import {
  validarAtualizacaoSecretaria,
  validarAtualizacaoServico,
  validarAtualizacaoSetor,
  validarCriacaoSecretaria,
  validarCriacaoServico,
  validarCriacaoSetor,
} from '../../validadores/catalogo.js'

function responder(res, resultado, status = 200) {
  if (resultado.naoEncontrado) {
    throw naoEncontrado('Registro do catálogo não encontrado.')
  }
  if (resultado.campos) {
    throw validacao(resultado.campos, 'Revise os dados do catálogo.')
  }
  res.status(status).json({ dados: resultado.registro })
}

export async function listar(_req, res) {
  const [dados, auditoria] = await Promise.all([
    Promise.resolve(obterCatalogo()),
    listarAuditoriaCatalogo(),
  ])
  res.json({ dados: { ...dados, auditoria } })
}

/** Mantém o contrato anterior de leitura das secretarias ativas. */
export function listarSecretarias(_req, res) {
  res.json({ dados: listarSecretariasAtivas() })
}

export async function criarSecretariaAdmin(req, res) {
  const dados = validarCriacaoSecretaria(req.body)
  responder(res, await criarSecretaria(dados, req.usuario), 201)
}

export async function atualizarSecretariaAdmin(req, res) {
  const dados = validarAtualizacaoSecretaria(req.body)
  responder(res, await atualizarSecretaria(req.params.id, dados, req.usuario))
}

export async function criarSetorAdmin(req, res) {
  const dados = validarCriacaoSetor(req.body)
  responder(res, await criarSetor(dados, req.usuario), 201)
}

export async function atualizarSetorAdmin(req, res) {
  const dados = validarAtualizacaoSetor(req.body)
  responder(res, await atualizarSetor(req.params.id, dados, req.usuario))
}

export async function criarServicoAdmin(req, res) {
  const dados = validarCriacaoServico(req.body)
  responder(res, await criarServico(dados, req.usuario), 201)
}

export async function atualizarServicoAdmin(req, res) {
  const dados = validarAtualizacaoServico(req.body)
  responder(res, await atualizarServico(req.params.id, dados, req.usuario))
}
