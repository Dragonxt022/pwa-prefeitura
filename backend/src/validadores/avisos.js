/**
 * Validação e normalização dos avisos.
 *
 * Campos do painel são normalizados aqui antes de chegar ao serviço. A
 * unicidade do título fica no serviço, pois depende dos avisos atuais.
 */
import { validacao } from '../utils/erros.js'
import { texto } from '../utils/texto.js'

const LIMITES = {
  titulo: 160,
  resumo: 300,
  categoria: 60,
}

const PRIORIDADES = ['alta', 'normal', 'baixa']

function lerTextoObrigatorio(valor, campo, campos, { minimo, maximo }) {
  const limpo = texto(valor)
  if (limpo.length < minimo) {
    campos[campo] = `Informe pelo menos ${minimo} caracteres.`
  } else if (limpo.length > maximo) {
    campos[campo] = `Use no máximo ${maximo} caracteres.`
  }
  return limpo
}

function lerBooleano(valor, campo, campos) {
  if (valor === undefined) return undefined
  if (typeof valor !== 'boolean') {
    campos[campo] = 'Informe verdadeiro ou falso.'
    return undefined
  }
  return valor
}

function validarPrioridade(valor, campos) {
  if (valor === undefined) return undefined
  const prioridade = texto(valor).toLowerCase()
  if (!PRIORIDADES.includes(prioridade)) {
    campos.prioridade = `Use uma destas opções: ${PRIORIDADES.join(', ')}.`
    return undefined
  }
  return prioridade
}

function validarPublicacao(valor, campos) {
  if (valor === undefined || valor === null || valor === '') return undefined
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) {
    campos.publicadoEm = 'Informe uma data e hora válidas.'
    return undefined
  }
  return data.toISOString()
}

function validarAviso(body, { criacao }) {
  const campos = {}
  const dados = {}

  if (criacao || body.titulo !== undefined) {
    dados.titulo = lerTextoObrigatorio(body.titulo, 'titulo', campos, {
      minimo: 3,
      maximo: LIMITES.titulo,
    })
  }

  if (criacao || body.resumo !== undefined) {
    dados.resumo = lerTextoObrigatorio(body.resumo, 'resumo', campos, {
      minimo: 10,
      maximo: LIMITES.resumo,
    })
  }

  if (criacao || body.categoria !== undefined) {
    dados.categoria = lerTextoObrigatorio(body.categoria, 'categoria', campos, {
      minimo: 2,
      maximo: LIMITES.categoria,
    })
  }

  const prioridade = validarPrioridade(body.prioridade, campos)
  if (criacao) dados.prioridade = prioridade ?? 'normal'
  else if (prioridade !== undefined) dados.prioridade = prioridade

  const publicadoEm = validarPublicacao(body.publicadoEm, campos)
  if (publicadoEm !== undefined) dados.publicadoEm = publicadoEm

  const ativo = lerBooleano(body.ativo, 'ativo', campos)
  if (criacao) dados.ativo = ativo ?? true
  else if (ativo !== undefined) dados.ativo = ativo

  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados do aviso.')
  }
  return dados
}

export const validarCriacaoAviso = (body = {}) => validarAviso(body, { criacao: true })

export const validarAtualizacaoAviso = (body = {}) => {
  if (Object.keys(body ?? {}).length === 0) {
    throw validacao({}, 'Informe ao menos um campo para atualizar.')
  }
  return validarAviso(body, { criacao: false })
}
