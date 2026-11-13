/**
 * Validação e normalização do catálogo administrativo.
 *
 * Campos recebidos do painel são normalizados aqui antes de chegar ao serviço.
 * A validação de unicidade e as regras de desativação ficam no serviço, pois
 * dependem do catálogo atual e das solicitações.
 */
import { validacao } from '../utils/erros.js'
import { texto } from '../utils/texto.js'

const LIMITES = {
  sigla: 32,
  nome: 180,
  slug: 180,
  descricao: 255,
  categoria: 80,
}

export function normalizarSigla(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITES.sigla)
}

export function normalizarSlug(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITES.slug)
}

function lerBooleano(valor, campo, campos) {
  if (valor === undefined) return undefined
  if (typeof valor !== 'boolean') {
    campos[campo] = 'Informe verdadeiro ou falso.'
    return undefined
  }
  return valor
}

function lerTextoObrigatorio(valor, campo, campos, { minimo = 3, maximo = LIMITES.nome } = {}) {
  const limpo = texto(valor)
  if (limpo.length < minimo) {
    campos[campo] = `Informe pelo menos ${minimo} caracteres.`
  } else if (limpo.length > maximo) {
    campos[campo] = `Use no máximo ${maximo} caracteres.`
  }
  return limpo
}

function lerTextoOpcional(valor, campo, campos, maximo = LIMITES.descricao) {
  if (valor === undefined) return undefined
  const limpo = texto(valor)
  if (limpo.length > maximo) campos[campo] = `Use no máximo ${maximo} caracteres.`
  return limpo
}

function lerInteiro(valor, campo, campos, { minimo, maximo, padrao }) {
  if (valor === undefined) return padrao
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    campos[campo] = `Informe um número inteiro entre ${minimo} e ${maximo}.`
    return padrao
  }
  return numero
}

function validarSecretaria(body, { criacao }) {
  const campos = {}
  const dados = {}

  if (criacao || body.sigla !== undefined) {
    const sigla = normalizarSigla(body.sigla)
    if (sigla.length < 2) {
      campos.sigla = 'Informe a sigla da secretaria.'
    } else if (!/^[A-Z0-9][A-Z0-9-]*$/.test(sigla)) {
      campos.sigla = 'Use apenas letras, números e hífen.'
    }
    dados.sigla = sigla
  }

  if (criacao || body.nome !== undefined) {
    dados.nome = lerTextoObrigatorio(body.nome, 'nome', campos, { minimo: 3 })
  }

  if (criacao || body.slug !== undefined) {
    const slug = normalizarSlug(body.slug || body.nome)
    if (slug.length < 2 || slug.length > LIMITES.slug) {
      campos.slug = 'Informe um identificador (slug) válido.'
    }
    dados.slug = slug
  }

  const ativo = lerBooleano(body.ativo, 'ativo', campos)
  if (criacao) dados.ativo = ativo ?? true
  else if (ativo !== undefined) dados.ativo = ativo

  const teste = lerBooleano(body.teste, 'teste', campos)
  if (criacao) dados.teste = teste ?? false
  else if (teste !== undefined) dados.teste = teste

  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados da secretaria.')
  }
  return dados
}

function validarSetor(body, { criacao }) {
  const campos = {}
  const dados = {}

  if (criacao || body.nome !== undefined) {
    dados.nome = lerTextoObrigatorio(body.nome, 'nome', campos, { minimo: 3 })
  }
  if (criacao || body.descricao !== undefined) {
    dados.descricao = lerTextoOpcional(body.descricao, 'descricao', campos, LIMITES.descricao) ?? ''
  }
  if (criacao || body.secretariaId !== undefined) {
    const secretariaId = texto(body.secretariaId)
    if (!secretariaId) campos.secretariaId = 'Escolha a secretaria do setor.'
    dados.secretariaId = secretariaId || null
  }

  const ativo = lerBooleano(body.ativo, 'ativo', campos)
  if (criacao) dados.ativo = ativo ?? true
  else if (ativo !== undefined) dados.ativo = ativo

  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados do setor.')
  }
  return dados
}

function validarServico(body, { criacao }) {
  const campos = {}
  const dados = {}

  if (criacao || body.titulo !== undefined) {
    dados.titulo = lerTextoObrigatorio(body.titulo, 'titulo', campos, { minimo: 3 })
  }
  if (criacao || body.descricao !== undefined) {
    dados.descricao = lerTextoOpcional(body.descricao, 'descricao', campos, LIMITES.descricao) ?? ''
  }
  if (criacao || body.categoria !== undefined) {
    dados.categoria = lerTextoOpcional(body.categoria, 'categoria', campos, LIMITES.categoria) ?? ''
  }
  if (criacao || body.setorId !== undefined) {
    const setorId = texto(body.setorId)
    if (!setorId) campos.setorId = 'Escolha o setor responsável pelo serviço.'
    dados.setorId = setorId || null
  }

  const prazoDias = lerInteiro(body.prazoDias, 'prazoDias', campos, {
    minimo: 1,
    maximo: 365,
    padrao: criacao ? 10 : undefined,
  })
  if (prazoDias !== undefined) dados.prazoDias = prazoDias

  const ordem = lerInteiro(body.ordem, 'ordem', campos, {
    minimo: 0,
    maximo: 9999,
    padrao: criacao ? 0 : undefined,
  })
  if (ordem !== undefined) dados.ordem = ordem

  for (const campo of ['destaque', 'novo', 'ativo']) {
    const valor = lerBooleano(body[campo], campo, campos)
    if (criacao && valor === undefined) {
      dados[campo] = campo === 'ativo'
    } else if (valor !== undefined) {
      dados[campo] = valor
    }
  }

  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados do serviço.')
  }
  return dados
}

export const validarCriacaoSecretaria = (body = {}) =>
  validarSecretaria(body, { criacao: true })

export const validarAtualizacaoSecretaria = (body = {}) => {
  if (Object.keys(body ?? {}).length === 0) {
    throw validacao({}, 'Informe ao menos um campo para atualizar.')
  }
  return validarSecretaria(body, { criacao: false })
}

export const validarCriacaoSetor = (body = {}) => validarSetor(body, { criacao: true })

export const validarAtualizacaoSetor = (body = {}) => {
  if (Object.keys(body ?? {}).length === 0) {
    throw validacao({}, 'Informe ao menos um campo para atualizar.')
  }
  return validarSetor(body, { criacao: false })
}

export const validarCriacaoServico = (body = {}) => validarServico(body, { criacao: true })

export const validarAtualizacaoServico = (body = {}) => {
  if (Object.keys(body ?? {}).length === 0) {
    throw validacao({}, 'Informe ao menos um campo para atualizar.')
  }
  return validarServico(body, { criacao: false })
}
