import { Router } from 'express'
import { naoEncontrado, validacao } from '../errors.js'
import { criarRateLimit } from '../middlewares/rate-limit.js'
import {
  STATUS,
  STATUS_ABERTOS,
  avaliarSolicitacao,
  buscarServico,
  buscarSolicitacao,
  buscarSolicitacaoPorClientId,
  criarSolicitacao,
  listarSemelhantes,
  setorPublico,
} from '../store.js'

const router = Router()

const LIMITES = {
  descricaoMin: 10,
  descricaoMax: 1200,
  enderecoMin: 5,
  enderecoMax: 200,
  contatoMax: 120,
  fotoMax: 1_800_000,
  observacaoMax: 500,
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

function validarLocalizacao(valor) {
  if (valor === undefined || valor === null) return null
  if (typeof valor !== 'object' || Array.isArray(valor)) {
    throw validacao({ localizacao: 'Localização inválida.' })
  }
  const latitude = Number(valor.latitude)
  const longitude = Number(valor.longitude)
  const precisao = valor.precisao === undefined ? null : Number(valor.precisao)
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw validacao({ localizacao: 'Latitude inválida.' })
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw validacao({ localizacao: 'Longitude inválida.' })
  }
  if (precisao !== null && (!Number.isFinite(precisao) || precisao < 0)) {
    throw validacao({ localizacao: 'Precisão inválida.' })
  }
  return { latitude, longitude, precisao }
}

function validarFoto(valor) {
  if (valor === undefined || valor === null || valor === '') return null
  if (typeof valor !== 'string' || !/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i.test(valor)) {
    throw validacao({ foto: 'A foto deve ser uma imagem JPEG, PNG ou WebP.' })
  }
  if (valor.length > LIMITES.fotoMax) {
    throw validacao({ foto: 'A foto é muito grande. Escolha uma imagem menor.' })
  }
  return valor
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

  const clientId = texto(body.clientId)
  if (clientId.length > 100) {
    campos.clientId = 'Identificador de envio inválido.'
  }

  let foto = null
  let localizacao = null
  try {
    foto = validarFoto(body.foto)
  } catch (erro) {
    Object.assign(campos, erro.campos ?? {})
  }
  try {
    localizacao = validarLocalizacao(body.localizacao)
  } catch (erro) {
    Object.assign(campos, erro.campos ?? {})
  }

  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os campos destacados.')
  }

  return { tipo, descricao, endereco, contato, foto, localizacao, clientId: clientId || null }
}

function decorar(solicitacao) {
  const restanteMs = new Date(solicitacao.slaEm).getTime() - Date.now()
  const transferencias = solicitacao.transferencias ?? []
  // A rota pública nunca devolve contato, identificador idempotente, dados da
  // triagem interna, motivo detalhado de transferência nem o nome de servidores
  // que movimentaram o pedido.
  const {
    clientId: _clientId,
    contato: _contato,
    triagem: _triagem,
    transferencias: _transferencias,
    ...publica
  } = solicitacao
  return {
    ...publica,
    historico: (publica.historico ?? []).map(({ por: _por, ...evento }) => {
      if (evento.tipo !== 'transferencia') return evento
      const transferencia = transferencias.find((item) => item.em === evento.em)
      const destino = setorPublico(transferencia?.paraSetorId)
      return {
        ...evento,
        observacao: destino
          ? `Solicitação encaminhada para ${destino.nome}.`
          : 'Solicitação encaminhada para outro setor.',
      }
    }),
    setor: setorPublico(solicitacao.setorId),
    setorNome: setorPublico(solicitacao.setorId)?.nome ?? null,
    transferida: transferencias.length > 0,
    slaDiasRestantes: Math.ceil(restanteMs / 86_400_000),
    slaVencido: STATUS_ABERTOS.includes(solicitacao.status) && restanteMs < 0,
  }
}

router.get('/semelhantes', (req, res) => {
  const dados = listarSemelhantes({
    tipo: texto(req.query.tipo),
    endereco: texto(req.query.endereco),
    latitude: req.query.latitude,
    longitude: req.query.longitude,
  })
  res.json({ dados })
})

router.post('/', criarRateLimit({ janelaMs: 60_000, maximo: 10 }), (req, res) => {
  const dados = validarSolicitacao(req.body)
  const existente = buscarSolicitacaoPorClientId(dados.clientId)
  if (existente) {
    return res.status(200).json({ dados: decorar(existente), criada: false })
  }

  const { solicitacao, criada } = criarSolicitacao(dados)
  return res.status(criada ? 201 : 200).json({ dados: decorar(solicitacao), criada })
})

router.post('/:protocolo/avaliacao', (req, res) => {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) {
    throw naoEncontrado('Não encontramos nenhuma solicitação com esse protocolo.')
  }
  if (solicitacao.status !== 'concluida') {
    throw validacao({ avaliacao: 'A avaliação fica disponível após a conclusão do atendimento.' })
  }
  if (solicitacao.avaliacao) {
    return res.status(409).json({
      erro: { codigo: 'ja_avaliada', mensagem: 'Este atendimento já foi avaliado.' },
    })
  }

  const nota = Number(req.body?.nota)
  const comentario = texto(req.body?.comentario)
  const campos = {}
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    campos.nota = 'Escolha uma nota de 1 a 5.'
  }
  if (comentario.length > LIMITES.observacaoMax) {
    campos.comentario = `O comentário deve ter no máximo ${LIMITES.observacaoMax} caracteres.`
  }
  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise a avaliação.')
  }

  const atualizada = avaliarSolicitacao(solicitacao.protocolo, { nota, comentario })
  return res.status(201).json({ dados: decorar(atualizada) })
})

router.get('/:protocolo', (req, res) => {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) {
    throw naoEncontrado('Não encontramos nenhuma solicitação com esse protocolo.')
  }
  res.json({ dados: decorar(solicitacao) })
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
      setorNome: setorPublico(solicitacao.setorId)?.nome ?? null,
      transferida: (solicitacao.transferencias ?? []).length > 0,
      slaEm: solicitacao.slaEm,
      slaVencido: STATUS_ABERTOS.includes(solicitacao.status) && new Date(solicitacao.slaEm).getTime() < Date.now(),
      avaliacao: solicitacao.avaliacao,
    },
  })
})

export default router
