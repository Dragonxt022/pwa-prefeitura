/**
 * Regras de cadastro, autenticação e perfil do cidadão.
 *
 * A conta é separada dos usuários da gestão. O cidadão só acessa os próprios
 * dados e pode corrigi-los, exportá-los ou solicitar a exclusão da conta
 * (LGPD). Senhas nunca são devolvidas nem registradas em log.
 */
import { normalizarCidadao } from '../dominio/cidadaos.js'
import {
  gerarHashSenha,
  gerarTokenSessao,
  hashToken,
  verificarSenha,
} from '../utils/seguranca.js'
import { normalizarEmail } from '../utils/texto.js'
import * as repositorioCidadaos from '../repositorios/cidadaos.js'
import * as repositorioRecuperacao from '../repositorios/recuperacao-senha.js'
import * as repositorioSessoes from '../repositorios/sessoes-cidadao.js'

const DIAS_SESSAO_LEMBRAR = Math.max(1, Number(process.env.CIDADAO_SESSION_DAYS) || 30)
const HORAS_SESSAO_PADRAO = 12

function novoId() {
  return `cidadao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function registrar(dados) {
  const email = normalizarEmail(dados.email)
  if (repositorioCidadaos.buscarPorEmail(email)) {
    return { erro: 'email_em_uso' }
  }

  const cidadao = normalizarCidadao({
    ...dados,
    id: novoId(),
    email,
    senhaHash: gerarHashSenha(dados.senha),
    ativo: true,
    criadoEm: new Date().toISOString(),
  })
  return { cidadao: await repositorioCidadaos.adicionar(cidadao) }
}

export function autenticar(email, senha) {
  const alvo = normalizarEmail(email)
  const cidadao = repositorioCidadaos.buscarPorEmail(alvo)
  if (!cidadao || !cidadao.ativo || !cidadao.senhaHash) return null
  if (!verificarSenha(senha, cidadao.senhaHash)) return null
  return cidadao
}

export async function criarSessao(cidadaoId, { lembrar = false } = {}) {
  const agora = Date.now()
  const duracaoMs = lembrar
    ? DIAS_SESSAO_LEMBRAR * 24 * 60 * 60 * 1000
    : HORAS_SESSAO_PADRAO * 60 * 60 * 1000
  const token = gerarTokenSessao()
  const sessao = {
    tokenHash: hashToken(token),
    cidadaoId,
    lembrar: Boolean(lembrar),
    criadaEm: new Date(agora).toISOString(),
    expiraEm: new Date(agora + duracaoMs).toISOString(),
  }
  return { token, sessao: await repositorioSessoes.criar(sessao) }
}

export async function cidadaoDaSessao(token) {
  if (!token) return null
  const alvo = hashToken(token)
  const sessao = repositorioSessoes.buscarPorTokenHash(alvo)
  if (!sessao) return null
  if (new Date(sessao.expiraEm).getTime() <= Date.now()) {
    await repositorioSessoes.removerPorTokenHash(alvo)
    return null
  }
  const cidadao = repositorioCidadaos.buscar(sessao.cidadaoId)
  if (!cidadao || !cidadao.ativo) return null
  return cidadao
}

export async function revogarSessao(token) {
  if (!token) return false
  return repositorioSessoes.removerPorTokenHash(hashToken(token))
}

export async function atualizarPerfil(id, dados) {
  const cidadao = repositorioCidadaos.buscar(id)
  if (!cidadao) return { erro: 'nao_encontrado' }

  if (dados.email !== undefined) {
    const email = normalizarEmail(dados.email)
    const existente = repositorioCidadaos.buscarPorEmail(email)
    if (existente && existente.id !== id) return { erro: 'email_em_uso' }
  }

  const atualizado = normalizarCidadao({
    ...cidadao,
    ...dados,
    senhaHash: dados.senha ? gerarHashSenha(dados.senha) : cidadao.senhaHash,
    atualizadoEm: new Date().toISOString(),
  })
  delete atualizado.senha
  return { cidadao: await repositorioCidadaos.salvar(atualizado) }
}

/**
 * Exclusão da conta: apaga os dados pessoais e revoga todas as sessões.
 *
 * O registro é mantido apenas como identificador anonimizado, sem e-mail,
 * telefone ou endereço, para não recriar a conta acidentalmente e preservar a
 * integridade de referências internas.
 */
export async function excluirConta(id, senha) {
  const cidadao = repositorioCidadaos.buscar(id)
  if (!cidadao) return { erro: 'nao_encontrado' }
  if (!verificarSenha(senha, cidadao.senhaHash)) return { erro: 'senha_invalida' }

  const agora = new Date().toISOString()
  const anonimizado = normalizarCidadao({
    ...cidadao,
    nome: 'Conta removida',
    email: `removido-${cidadao.id}@anonimo.invalid`,
    senhaHash: null,
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: null,
    bairro: '',
    cidade: '',
    uf: '',
    ativo: false,
    removidoEm: agora,
    atualizadoEm: agora,
  })

  await repositorioCidadaos.salvar(anonimizado)
  await repositorioRecuperacao.removerDoCidadao(id)
  const sessoesRemovidas = await repositorioSessoes.removerDoCidadao(id)
  return { ok: true, sessoesRemovidas }
}
