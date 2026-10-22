import { Router } from 'express'
import { naoEncontrado, validacao } from '../errors.js'
import { criarRateLimit } from '../middlewares/rate-limit.js'
import {
  STATUS,
  buscarServico,
  buscarSolicitacao,
  criarSolicitacao,
  solicitacoes,
} from '../store.js'

const router = Router()

const LIMITES = {
  descricaoMin: 10,
  descricaoMax: 1200,
  enderecoMin: 5,
  enderecoMax: 200,
  contatoMax: 120,
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

function validarSolicitacao(body = {}) {
  const campos = {}

  const tipo = texto(body.tipo)
  if (!tipo) {
    campos.tipo = 'Selecione o tipo de solicitação.'
  } else if (!buscarServico(tipo)) {
    campos.tipo = 'Tipo de solicitação desconhecido.'
  }

  const descricao = texto(body.descricao)
  if (descricao.length < LIMITES.descricaoMin) {
    campos.descricao = `Descreva o problema com pelo menos ${LIMITES.descricaoMin} caracteres.`
  } else if (descricao.length > LIMITES.descricaoMax) {
    campos.descricao = `A descrição deve ter no máximo ${LIMITES.descricaoMax} caracteres.`
  }

  const endereco = texto(body.endereco)
  if (endereco.length < LIMITES.enderecoMin) {
    campos.endereco = 'Informe o endereço com referência (rua e número ou ponto conhecido).'
  } else if (endereco.length > LIMITES.enderecoMax) {
    campos.endereco = `O endereço deve ter no máximo ${LIMITES.enderecoMax} caracteres.`
  }

  const contato = texto(body.contato)
  if (contato.length > LIMITES.contatoMax) {
    campos.contato = `O contato deve ter no máximo ${LIMITES.contatoMax} caracteres.`
  }

  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os campos destacados.')
  }

  return { tipo, descricao, endereco, contato }
}

router.get('/', (req, res) => {
  const status = texto(req.query.status)
  const tipo = texto(req.query.tipo)

  let dados = solicitacoes
  if (status) dados = dados.filter((item) => item.status === status)
  if (tipo) dados = dados.filter((item) => item.tipo === tipo)

  const limite = Math.min(Number(req.query.limite) || 50, 100)
  res.json({ dados: dados.slice(0, limite), total: dados.length })
})

router.post('/', criarRateLimit({ janelaMs: 60_000, maximo: 10 }), (req, res) => {
  const dados = validarSolicitacao(req.body)
  const solicitacao = criarSolicitacao(dados)
  res.status(201).json({ dados: solicitacao })
})

router.get('/:protocolo', (req, res) => {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) {
    throw naoEncontrado('Não encontramos nenhuma solicitação com esse protocolo.')
  }
  res.json({ dados: solicitacao })
})

router.get('/:protocolo/status', (req, res) => {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) {
    throw naoEncontrado('Não encontramos nenhuma solicitação com esse protocolo.')
  }
  res.json({
    dados: {
      protocolo: solicitacao.protocolo,
      status: solicitacao.status,
      statusDescricao: STATUS[solicitacao.status],
      atualizadoEm: solicitacao.atualizadoEm,
    },
  })
})

export default router
