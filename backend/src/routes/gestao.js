import { Router } from 'express'
import { AppError, naoEncontrado, validacao } from '../errors.js'
import { criarRateLimit } from '../middlewares/rate-limit.js'
import {
  PAPEIS,
  STATUS,
  STATUS_ABERTOS,
  atualizarStatus,
  atualizarUsuario,
  autenticarUsuario,
  buscarServico,
  buscarSolicitacao,
  buscarUsuario,
  criarSessao,
  criarUsuario,
  estatisticasGestao,
  listarSetores,
  listarSolicitacoes,
  listarUsuarios,
  revogarSessao,
  setorPublico,
  transferirSolicitacao,
  usuarioDaSessao,
  usuarioPublico,
  usuarios,
} from '../store.js'
import { triagemAutomaticaAtiva } from '../triagem.js'

const router = Router()
const COOKIE_SESSAO = 'prefeitura_sessao'
// O token legado é opt-in: só existe quando ADMIN_TOKEN é definido explicitamente.
const TOKEN_ADMIN_LEGADO = process.env.ADMIN_TOKEN || ''
const DIAS_COOKIE_LEMBRAR = Math.max(1, Number(process.env.SESSION_DAYS) || 30)

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

function booleano(valor) {
  return valor === true || valor === 1 || ['1', 'true', 'sim', 'on'].includes(String(valor).toLowerCase())
}

function lerCookie(req, nome) {
  const cabecalho = req.get('cookie') || ''
  for (const parte of cabecalho.split(';')) {
    const [chave, ...resto] = parte.trim().split('=')
    if (chave === nome) {
      try {
        return decodeURIComponent(resto.join('='))
      } catch {
        return resto.join('=')
      }
    }
  }
  return ''
}

function definirCookieSessao(res, token, lembrar) {
  const atributos = [
    `${COOKIE_SESSAO}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.COOKIE_SECURE === 'true') atributos.push('Secure')
  if (lembrar) atributos.push(`Max-Age=${DIAS_COOKIE_LEMBRAR * 24 * 60 * 60}`)
  res.append('Set-Cookie', atributos.join('; '))
}

function limparCookieSessao(res) {
  const atributos = [
    `${COOKIE_SESSAO}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]
  if (process.env.COOKIE_SECURE === 'true') atributos.push('Secure')
  res.append('Set-Cookie', atributos.join('; '))
}

function autenticacaoDaRequisicao(req) {
  const token = lerCookie(req, COOKIE_SESSAO)
  const usuarioDaCookie = usuarioDaSessao(token)
  if (usuarioDaCookie) return { usuario: usuarioDaCookie, token }

  // Compatibilidade com scripts e testes antigos. O token legado é aceito
  // somente como administrador e não cria uma sessão persistente.
  if (TOKEN_ADMIN_LEGADO && req.get('x-admin-token') === TOKEN_ADMIN_LEGADO) {
    const admin = usuarios.find((usuario) => usuario.papel === 'admin' && usuario.ativo)
    if (admin) return { usuario: admin, token: '' }
  }

  return null
}

function exigirSessao(req, _res, next) {
  const autenticacao = autenticacaoDaRequisicao(req)
  if (!autenticacao) {
    throw new AppError(401, 'nao_autorizado', 'Sessão ausente ou expirada. Entre novamente.')
  }
  req.usuario = autenticacao.usuario
  req.sessaoToken = autenticacao.token
  next()
}

function exigirAdmin(req, _res, next) {
  if (req.usuario?.papel !== 'admin') {
    throw new AppError(403, 'sem_permissao', 'Apenas administradores podem executar esta ação.')
  }
  next()
}

function podeAcessar(usuario, solicitacao) {
  if (!solicitacao) return false
  if (usuario.papel === 'setor') return solicitacao.setorId === usuario.setorId
  return true
}

function setorDoFiltro(req) {
  if (req.usuario.papel === 'setor') return req.usuario.setorId
  return texto(req.query.setor) || undefined
}

function decorar(solicitacao) {
  const restanteMs = new Date(solicitacao.slaEm).getTime() - Date.now()
  const transferencias = (solicitacao.transferencias ?? []).map((transferencia) => ({
    ...transferencia,
    deSetor: setorPublico(transferencia.deSetorId),
    paraSetor: setorPublico(transferencia.paraSetorId),
  }))
  return {
    ...solicitacao,
    setor: setorPublico(solicitacao.setorId),
    setorNome: setorPublico(solicitacao.setorId)?.nome ?? 'Triagem',
    transferencias,
    transferida: transferencias.length > 0,
    ultimaTransferencia: transferencias.at(-1) ?? null,
    slaDiasRestantes: Math.ceil(restanteMs / 86_400_000),
    slaVencido: STATUS_ABERTOS.includes(solicitacao.status) && restanteMs < 0,
  }
}

function validarSenha(senha, campos, obrigatoria = true) {
  if (!senha && !obrigatoria) return
  if (typeof senha !== 'string' || senha.length < 8) {
    campos.senha = 'A senha deve ter pelo menos 8 caracteres.'
  }
}

function validarUsuario(body = {}, { criando = false } = {}) {
  const campos = {}
  const nome = texto(body.nome)
  const email = texto(body.email)
  const papel = texto(body.papel)
  const setorId = texto(body.setorId)
  const senha = typeof body.senha === 'string' ? body.senha : ''

  if (criando && nome.length < 3) campos.nome = 'Informe o nome do usuário.'
  if (criando && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    campos.email = 'Informe um e-mail válido.'
  }
  if (criando && !PAPEIS[papel]) campos.papel = 'Escolha um papel válido.'
  if (criando) validarSenha(senha, campos)
  if (papel === 'setor' && (!setorId || !listarSetores().some((setor) => setor.id === setorId))) {
    campos.setorId = 'Escolha o setor do usuário.'
  }
  if (Object.keys(campos).length > 0) {
    throw validacao(campos, 'Revise os dados do usuário.')
  }
  return { nome, email, papel, setorId: papel === 'setor' ? setorId : null, senha }
}

function respostaUsuario(usuario) {
  return usuarioPublico(usuario)
}

router.post('/login', criarRateLimit({ janelaMs: 60_000, maximo: 20 }), (req, res) => {
  const email = texto(req.body?.email)
  const senha = typeof req.body?.senha === 'string' ? req.body.senha : ''
  const campos = {}
  if (!email) campos.email = 'Informe o e-mail.'
  if (!senha) campos.senha = 'Informe a senha.'
  if (Object.keys(campos).length > 0) throw validacao(campos, 'Preencha e-mail e senha.')

  const usuario = autenticarUsuario(email, senha)
  if (!usuario) {
    throw new AppError(401, 'credenciais_invalidas', 'E-mail ou senha inválidos.')
  }

  const lembrar = booleano(req.body?.lembrar)
  const { token, sessao } = criarSessao(usuario.id, { lembrar })
  definirCookieSessao(res, token, lembrar)
  return res.json({
    dados: {
      usuario: respostaUsuario(usuario),
      expiraEm: sessao.expiraEm,
      lembrar: sessao.lembrar,
      triagemAutomatica: triagemAutomaticaAtiva(),
    },
  })
})

router.post('/logout', (req, res) => {
  const token = lerCookie(req, COOKIE_SESSAO)
  if (token) revogarSessao(token)
  limparCookieSessao(res)
  res.json({ dados: { ok: true } })
})

router.use(exigirSessao)

router.get('/sessao', (req, res) => {
  res.json({
    dados: {
      usuario: respostaUsuario(req.usuario),
      triagemAutomatica: triagemAutomaticaAtiva(),
    },
  })
})

router.get('/setores', (_req, res) => {
  res.json({ dados: listarSetores() })
})

router.get('/usuarios', exigirAdmin, (_req, res) => {
  res.json({ dados: listarUsuarios(), papeis: PAPEIS })
})

router.post('/usuarios', exigirAdmin, (req, res) => {
  const dados = validarUsuario(req.body, { criando: true })
  const resultado = criarUsuario(dados)
  if (resultado.erro === 'email_em_uso') {
    throw validacao({ email: 'Já existe um usuário com este e-mail.' })
  }
  if (resultado.erro) throw validacao({}, 'Não foi possível criar o usuário.')
  res.status(201).json({ dados: resultado.usuario })
})

router.patch('/usuarios/:id', exigirAdmin, (req, res) => {
  const alvo = buscarUsuario(req.params.id)
  if (!alvo) throw naoEncontrado('Usuário não encontrado.')
  if (alvo.id === req.usuario.id && req.body?.ativo !== undefined && !booleano(req.body.ativo)) {
    throw validacao({ ativo: 'Você não pode desativar a própria conta.' })
  }
  if (alvo.id === req.usuario.id && req.body?.papel !== undefined && texto(req.body.papel) !== 'admin') {
    throw validacao({ papel: 'Você não pode remover o próprio acesso de administrador.' })
  }

  const campos = {}
  if (req.body?.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(req.body.email))) {
    campos.email = 'Informe um e-mail válido.'
  }
  if (req.body?.senha) validarSenha(req.body.senha, campos)
  if (req.body?.papel !== undefined && !PAPEIS[texto(req.body.papel)]) {
    campos.papel = 'Escolha um papel válido.'
  }
  const papelFinal = req.body?.papel !== undefined ? texto(req.body.papel) : alvo.papel
  const setorFinal = req.body?.setorId !== undefined
    ? texto(req.body.setorId)
    : (alvo.papel === 'setor' ? alvo.setorId : '')
  if (papelFinal === 'setor' && (!setorFinal || !listarSetores().some((setor) => setor.id === setorFinal))) {
    campos.setorId = 'Escolha o setor do usuário.'
  }
  if (Object.keys(campos).length > 0) throw validacao(campos, 'Revise os dados do usuário.')

  const resultado = atualizarUsuario(alvo.id, {
    nome: req.body?.nome !== undefined ? texto(req.body.nome) : undefined,
    email: req.body?.email !== undefined ? texto(req.body.email) : undefined,
    senha: req.body?.senha || undefined,
    papel: req.body?.papel !== undefined ? texto(req.body.papel) : undefined,
    setorId: req.body?.setorId !== undefined ? texto(req.body.setorId) : undefined,
    ativo: req.body?.ativo !== undefined ? booleano(req.body.ativo) : undefined,
  })
  if (resultado.erro === 'email_em_uso') {
    throw validacao({ email: 'Já existe um usuário com este e-mail.' })
  }
  if (resultado.erro) throw validacao({}, 'Não foi possível atualizar o usuário.')
  res.json({ dados: resultado.usuario })
})

router.get('/solicitacoes', (req, res) => {
  const setorId = setorDoFiltro(req)
  const ids = texto(req.query.ids).split(',').map((id) => id.trim()).filter(Boolean)
  const { dados, total } = listarSolicitacoes({
    status: texto(req.query.status),
    tipo: texto(req.query.tipo),
    busca: texto(req.query.busca),
    setorId,
    ids,
    limite: req.query.limite,
  })

  res.json({
    dados: dados.map(decorar),
    total,
    estatisticas: estatisticasGestao({ setorId }),
    triagemAutomatica: triagemAutomaticaAtiva(),
  })
})

router.get('/solicitacoes/:protocolo', (req, res) => {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')
  if (!podeAcessar(req.usuario, solicitacao)) {
    throw new AppError(403, 'sem_permissao', 'Esta solicitação pertence a outro setor.')
  }
  res.json({ dados: decorar(solicitacao) })
})

router.patch('/solicitacoes/:protocolo/status', (req, res) => {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')
  if (!podeAcessar(req.usuario, solicitacao)) {
    throw new AppError(403, 'sem_permissao', 'Esta solicitação pertence a outro setor.')
  }

  const status = texto(req.body?.status)
  const observacao = texto(req.body?.observacao)
  const prioridade = texto(req.body?.prioridade)
  const campos = {}

  if (!STATUS[status]) campos.status = 'Escolha um status válido.'
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
    porUsuario: req.usuario,
  })

  res.json({
    dados: decorar(atualizada),
    estatisticas: estatisticasGestao({ setorId: setorDoFiltro(req) }),
  })
})

router.patch('/solicitacoes/:protocolo/transferir', (req, res) => {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')
  if (!podeAcessar(req.usuario, solicitacao)) {
    throw new AppError(403, 'sem_permissao', 'Você só pode transferir solicitações do seu setor.')
  }

  const setorDestinoId = texto(req.body?.setorDestinoId)
  const motivo = texto(req.body?.motivo)
  const tipoDestino = texto(req.body?.tipoDestino)
  const campos = {}

  if (!setorDestinoId || !listarSetores().some((setor) => setor.id === setorDestinoId)) {
    campos.setorDestinoId = 'Escolha um setor de destino válido.'
  }
  if (motivo.length < 3) {
    campos.motivo = 'Informe o motivo da transferência.'
  } else if (motivo.length > 500) {
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

  const resultado = transferirSolicitacao(solicitacao.protocolo, {
    setorDestinoId,
    motivo,
    tipoDestino: tipoDestino || undefined,
    recalcularSla: booleano(req.body?.recalcularSla),
    porUsuario: req.usuario,
  })

  if (resultado.erro) {
    throw validacao({}, 'Não foi possível transferir a solicitação.')
  }

  res.json({
    dados: decorar(resultado.solicitacao),
    estatisticas: estatisticasGestao({ setorId: setorDoFiltro(req) }),
  })
})

export default router
