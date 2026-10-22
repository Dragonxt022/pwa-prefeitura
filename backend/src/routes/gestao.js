import { Router } from 'express'
import { AppError, naoEncontrado, validacao } from '../errors.js'
import {
  STATUS,
  STATUS_ABERTOS,
  atualizarStatus,
  buscarSolicitacao,
  estatisticasGestao,
  listarSolicitacoes,
} from '../store.js'

const router = Router()
const TOKEN_ADMIN = process.env.ADMIN_TOKEN || 'prefeitura-demo'

function exigirAdmin(req, _res, next) {
  if (req.get('x-admin-token') !== TOKEN_ADMIN) {
    throw new AppError(401, 'nao_autorizado', 'Token de gestão inválido ou ausente.')
  }
  next()
}

function decorar(solicitacao) {
  const restanteMs = new Date(solicitacao.slaEm).getTime() - Date.now()
  return {
    ...solicitacao,
    slaDiasRestantes: Math.ceil(restanteMs / 86_400_000),
    slaVencido: STATUS_ABERTOS.includes(solicitacao.status) && restanteMs < 0,
  }
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

router.use(exigirAdmin)

router.get('/sessao', (_req, res) => {
  res.json({ dados: { ok: true, perfil: 'gestao' } })
})

router.get('/solicitacoes', (req, res) => {
  const { dados, total } = listarSolicitacoes({
    status: texto(req.query.status),
    tipo: texto(req.query.tipo),
    busca: texto(req.query.busca),
    limite: req.query.limite,
  })

  res.json({
    dados: dados.map(decorar),
    total,
    estatisticas: estatisticasGestao(),
  })
})

router.get('/solicitacoes/:protocolo', (req, res) => {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')
  res.json({ dados: decorar(solicitacao) })
})

router.patch('/solicitacoes/:protocolo/status', (req, res) => {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')

  const status = texto(req.body?.status)
  const observacao = texto(req.body?.observacao)
  const prioridade = texto(req.body?.prioridade)
  const campos = {}

  if (!STATUS[status]) {
    campos.status = 'Escolha um status válido.'
  }
  if (observacao.length > 500) {
    campos.observacao = 'A observação deve ter no máximo 500 caracteres.'
  }
  if (prioridade && !['alta', 'normal', 'baixa'].includes(prioridade)) {
    campos.prioridade = 'Prioridade inválida.'
  }
  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise a atualização de status.')
  }

  const atualizada = atualizarStatus(solicitacao.protocolo, {
    status,
    observacao,
    prioridade: prioridade || undefined,
  })

  res.json({ dados: decorar(atualizada), estatisticas: estatisticasGestao() })
})

export default router
