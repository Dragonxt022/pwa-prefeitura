/**
 * Regras de usuários e sessões.
 *
 * Autenticação, criação/edição de usuários, escopo de setor e ciclo de vida das
 * sessões. A persistência e a montagem do contrato público ficam,
 * respectivamente, nos repositórios e apresentadores.
 */
import { gerarHashSenha, gerarTokenSessao, hashToken, verificarSenha } from '../utils/seguranca.js'
import * as repositorioUsuarios from '../repositorios/usuarios.js'
import * as repositorioSessoes from '../repositorios/sessoes.js'
import { normalizarUsuario } from '../dominio/normalizacao.js'
import { PAPEIS, buscarSetor } from '../dominio/catalogo.js'
import { normalizarEmail } from '../utils/texto.js'

const DIAS_SESSAO_LEMBRAR = Math.max(1, Number(process.env.SESSION_DAYS) || 30)
const HORAS_SESSAO_PADRAO = 12

export function autenticarUsuario(email, senha) {
  const alvo = normalizarEmail(email)
  const usuario = repositorioUsuarios.buscarPorEmail(alvo)
  if (!usuario || !usuario.ativo || !verificarSenha(senha, usuario.senhaHash)) return null
  return usuario
}

export function buscarAdminAtivo() {
  return repositorioUsuarios.buscarAdminAtivo()
}

export function listarUsuarios() {
  return repositorioUsuarios
    .listarTodos()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function buscarUsuario(id) {
  return repositorioUsuarios.buscar(id)
}

export function criarUsuario({ nome, email, senha, papel, setorId }) {
  const emailNormalizado = normalizarEmail(email)
  if (!emailNormalizado) return { erro: 'email_obrigatorio' }
  if (repositorioUsuarios.buscarPorEmail(emailNormalizado)) {
    return { erro: 'email_em_uso' }
  }
  if (!PAPEIS[papel]) return { erro: 'papel_invalido' }
  const setor = papel === 'setor' ? buscarSetor(setorId) : null
  if (papel === 'setor' && (!setor || !setor.ativo)) return { erro: 'setor_invalido' }

  const usuario = normalizarUsuario({
    id: `usuario-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome,
    email: emailNormalizado,
    senha,
    papel,
    setorId: papel === 'setor' ? setorId : (papel === 'triagem' ? 'triagem' : null),
    ativo: true,
    criadoEm: new Date().toISOString(),
  })
  return { usuario: repositorioUsuarios.adicionar(usuario) }
}

export function atualizarUsuario(id, { nome, email, senha, papel, setorId, ativo }) {
  const usuario = repositorioUsuarios.buscar(id)
  if (!usuario) return { erro: 'nao_encontrado' }

  let emailNormalizado
  if (email !== undefined) {
    emailNormalizado = normalizarEmail(email)
    if (!emailNormalizado) return { erro: 'email_obrigatorio' }
    const existente = repositorioUsuarios.buscarPorEmail(emailNormalizado)
    if (existente && existente.id !== id) {
      return { erro: 'email_em_uso' }
    }
  }
  if (papel !== undefined && !PAPEIS[papel]) return { erro: 'papel_invalido' }

  // Calcula o estado final antes de alterar o objeto: uma validação que falha
  // não pode deixar o usuário em memória com papel/setor inconsistentes.
  const papelFinal = papel ?? usuario.papel
  let setorFinal = null
  if (papelFinal === 'setor') {
    setorFinal = setorId !== undefined
      ? setorId
      : (usuario.papel === 'setor' ? usuario.setorId : null)
    const setor = buscarSetor(setorFinal)
    if (!setor || !setor.ativo) return { erro: 'setor_invalido' }
  } else if (papelFinal === 'triagem') {
    setorFinal = 'triagem'
  }

  if (emailNormalizado !== undefined) usuario.email = emailNormalizado
  if (nome !== undefined) usuario.nome = String(nome).trim()
  if (senha) usuario.senhaHash = gerarHashSenha(senha)
  usuario.papel = papelFinal
  usuario.setorId = setorFinal
  if (ativo !== undefined) usuario.ativo = Boolean(ativo)
  return { usuario: repositorioUsuarios.salvar(usuario) }
}

export function criarSessao(usuarioId, { lembrar = false } = {}) {
  const agora = Date.now()
  const duracaoMs = lembrar
    ? DIAS_SESSAO_LEMBRAR * 24 * 60 * 60 * 1000
    : HORAS_SESSAO_PADRAO * 60 * 60 * 1000
  const token = gerarTokenSessao()
  const sessao = {
    tokenHash: hashToken(token),
    usuarioId,
    lembrar: Boolean(lembrar),
    criadaEm: new Date(agora).toISOString(),
    expiraEm: new Date(agora + duracaoMs).toISOString(),
  }
  return { token, sessao: repositorioSessoes.criar(sessao) }
}

export function usuarioDaSessao(token) {
  if (!token) return null
  const alvo = hashToken(token)
  const sessao = repositorioSessoes.buscarPorTokenHash(alvo)
  if (!sessao) return null
  if (new Date(sessao.expiraEm).getTime() <= Date.now()) {
    repositorioSessoes.removerPorTokenHash(alvo)
    return null
  }
  const usuario = repositorioUsuarios.buscar(sessao.usuarioId)
  if (!usuario || !usuario.ativo) return null
  return usuario
}

export function revogarSessao(token) {
  if (!token) return false
  return repositorioSessoes.removerPorTokenHash(hashToken(token))
}
