import { STATUS, buscarServico, listarSetores } from '../dominio/catalogo.js'
import { validacao } from '../utils/erros.js'
import { booleano, texto } from '../utils/texto.js'

export const LIMITES = {
  descricaoMin: 10,
  descricaoMax: 1200,
  enderecoMin: 5,
  enderecoMax: 200,
  contatoMax: 120,
  fotoMax: 1_800_000,
  observacaoMax: 500,
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

export function validarSolicitacao(body = {}) {
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

export function validarAvaliacao(body = {}) {
  const nota = Number(body.nota)
  const comentario = texto(body.comentario)
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
  return { nota, comentario }
}

export function validarAtualizacaoStatus(body = {}) {
  const status = texto(body.status)
  const observacao = texto(body.observacao)
  const prioridade = texto(body.prioridade)
  const campos = {}

  if (!STATUS[status]) campos.status = 'Escolha um status válido.'
  if (observacao.length > LIMITES.observacaoMax) {
    campos.observacao = 'A observação deve ter no máximo 500 caracteres.'
  }
  if (prioridade && !['alta', 'normal', 'baixa'].includes(prioridade)) {
    campos.prioridade = 'Prioridade inválida.'
  }
  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise a atualização de status.')
  }

  return { status, observacao, prioridade: prioridade || undefined }
}

export function validarTransferencia(body = {}, solicitacao) {
  const setorDestinoId = texto(body.setorDestinoId)
  const motivo = texto(body.motivo)
  const tipoDestino = texto(body.tipoDestino)
  const campos = {}

  if (!setorDestinoId || !listarSetores().some((setor) => setor.id === setorDestinoId)) {
    campos.setorDestinoId = 'Escolha um setor de destino válido.'
  }
  if (motivo.length < 3) {
    campos.motivo = 'Informe o motivo da transferência.'
  } else if (motivo.length > LIMITES.observacaoMax) {
    campos.motivo = 'O motivo deve ter no máximo 500 caracteres.'
  }
  if (tipoDestino && !buscarServico(tipoDestino)) {
    campos.tipoDestino = 'Serviço inválido.'
  }
  if (setorDestinoId === solicitacao.setorId && (!tipoDestino || tipoDestino === solicitacao.tipo)) {
    campos.setorDestinoId = 'Escolha um setor ou serviço diferente para transferir.'
  }
  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados da transferência.')
  }

  return {
    setorDestinoId,
    motivo,
    tipoDestino: tipoDestino || undefined,
    recalcularSla: booleano(body.recalcularSla),
  }
}
