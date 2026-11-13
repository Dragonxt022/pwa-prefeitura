/**
 * Controllers da conta do cidadão.
 *
 * Nenhuma resposta inclui hash de senha. Erros de login são genéricos para não
 * confirmar a existência de um e-mail. As rotas de perfil só operam sobre o
 * cidadão autenticado pelo cookie.
 */
import { cidadaoPublico } from '../apresentadores/cidadaos.js'
import { apresentarSolicitacaoPublica } from '../apresentadores/solicitacoes.js'
import { VERSAO_PRIVACIDADE } from '../dominio/cidadaos.js'
import {
  codigoAcessoInvalido,
  credenciaisInvalidas,
  jaAvaliada,
  naoEncontrado,
  validacao,
} from '../utils/erros.js'
import { texto } from '../utils/texto.js'
import { validarAvaliacao } from '../validadores/solicitacoes.js'
import { booleano } from '../utils/texto.js'
import {
  definirCookieCidadao,
  limparCookieCidadao,
} from '../middlewares/autenticacao-cidadao.js'
import {
  atualizarPerfil,
  autenticar,
  criarSessao,
  excluirConta,
  registrar,
  revogarSessao,
} from '../servicos/cidadaos.js'
import {
  avaliarSolicitacao,
  buscarSolicitacaoDoCidadao,
  listarSolicitacoesDoCidadao,
  vincularSolicitacao,
} from '../servicos/solicitacoes.js'
import {
  validarAtualizacaoPerfil,
  validarCadastro,
  validarExclusaoConta,
  validarLogin,
  validarRedefinicaoSenha,
  validarSolicitacaoRecuperacao,
} from '../validadores/cidadaos.js'
import {
  redefinirSenha as redefinirSenhaServico,
  solicitarRecuperacao,
} from '../servicos/recuperacao-senha.js'

export async function cadastrar(req, res) {
  const dados = validarCadastro(req.body)
  const resultado = await registrar(dados)
  if (resultado.erro === 'email_em_uso') {
    throw validacao({ email: 'Já existe uma conta com este e-mail.' })
  }

  const lembrar = booleano(req.body?.lembrar)
  const { token, sessao } = await criarSessao(resultado.cidadao.id, { lembrar })
  definirCookieCidadao(res, token, lembrar)
  return res.status(201).json({
    dados: {
      cidadao: cidadaoPublico(resultado.cidadao),
      expiraEm: sessao.expiraEm,
      lembrar,
      privacidadeVersao: VERSAO_PRIVACIDADE,
    },
  })
}

export async function login(req, res) {
  const { email, senha } = validarLogin(req.body)
  const cidadao = autenticar(email, senha)
  if (!cidadao) {
    throw credenciaisInvalidas('E-mail ou senha inválidos.')
  }

  const lembrar = booleano(req.body?.lembrar)
  const { token, sessao } = await criarSessao(cidadao.id, { lembrar })
  definirCookieCidadao(res, token, lembrar)
  return res.json({
    dados: {
      cidadao: cidadaoPublico(cidadao),
      expiraEm: sessao.expiraEm,
      lembrar,
    },
  })
}

export async function logout(req, res) {
  if (req.tokenCidadao) await revogarSessao(req.tokenCidadao)
  limparCookieCidadao(res)
  return res.json({ dados: { ok: true } })
}

export function sessao(req, res) {
  res.json({
    dados: req.cidadao
      ? { cidadao: cidadaoPublico(req.cidadao), privacidadeVersao: VERSAO_PRIVACIDADE }
      : null,
  })
}

export function perfil(req, res) {
  res.json({ dados: cidadaoPublico(req.cidadao) })
}

export async function atualizar(req, res) {
  const dados = validarAtualizacaoPerfil(req.body)
  const resultado = await atualizarPerfil(req.cidadao.id, dados)
  if (resultado.erro === 'email_em_uso') {
    throw validacao({ email: 'Já existe uma conta com este e-mail.' })
  }
  if (resultado.erro) throw validacao({}, 'Não foi possível atualizar o perfil.')
  return res.json({ dados: cidadaoPublico(resultado.cidadao) })
}

/** Portabilidade: devolve tudo o que a conta guarda sobre o cidadão. */
export function exportarDados(req, res) {
  const dados = {
    exportadoEm: new Date().toISOString(),
    privacidadeVersao: req.cidadao.consentimentoVersao,
    consentimentoEm: req.cidadao.consentimentoEm,
    cidadao: cidadaoPublico(req.cidadao),
  }
  res.set('Content-Disposition', 'attachment; filename="meus-dados-prefeitura.json"')
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.send(JSON.stringify(dados, null, 2))
}

export function listarSolicitacoes(req, res) {
  const dados = listarSolicitacoesDoCidadao(req.cidadao.id)
    .map(apresentarSolicitacaoPublica)
  res.json({ dados, total: dados.length })
}

export function detalharSolicitacao(req, res) {
  const solicitacao = buscarSolicitacaoDoCidadao(req.cidadao.id, req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')
  res.json({ dados: apresentarSolicitacaoPublica(solicitacao) })
}

export async function vincularPedido(req, res) {
  const protocolo = texto(req.body?.protocolo).toUpperCase()
  const codigoAcesso = texto(req.body?.codigoAcesso)
  const resultado = await vincularSolicitacao(req.cidadao.id, protocolo, codigoAcesso)
  if (resultado.erro) throw codigoAcessoInvalido()
  res.json({ dados: apresentarSolicitacaoPublica(resultado.solicitacao) })
}

export async function avaliarPedido(req, res) {
  const solicitacao = buscarSolicitacaoDoCidadao(req.cidadao.id, req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')
  if (solicitacao.status !== 'concluida') {
    throw validacao({
      avaliacao: 'A avaliação fica disponível após a conclusão do atendimento.',
    })
  }
  if (solicitacao.avaliacao) throw jaAvaliada()

  const dados = validarAvaliacao(req.body)
  const atualizada = await avaliarSolicitacao(solicitacao.protocolo, dados)
  return res.status(201).json({ dados: apresentarSolicitacaoPublica(atualizada) })
}

/**
 * Sempre devolve a mesma resposta, exista ou não a conta, para não permitir
 * descobrir e-mails cadastrados.
 */
export async function solicitarSenha(req, res) {
  const { email } = validarSolicitacaoRecuperacao(req.body)
  await solicitarRecuperacao(email)
  return res.json({
    dados: {
      ok: true,
      mensagem:
        'Se houver uma conta com este e-mail, enviaremos um link para criar uma nova senha.',
    },
  })
}

export async function redefinirSenha(req, res) {
  const { token, novaSenha } = validarRedefinicaoSenha(req.body)
  const resultado = await redefinirSenhaServico(token, novaSenha)
  if (resultado.erro) {
    throw validacao(
      {
        token:
          resultado.erro === 'token_expirado'
            ? 'Este link expirou. Solicite um novo.'
            : 'Este link é inválido ou já foi usado. Solicite um novo.',
      },
      'Não foi possível redefinir a senha.',
    )
  }
  return res.json({ dados: { ok: true } })
}

export async function excluir(req, res) {
  const { senha } = validarExclusaoConta(req.body)
  const resultado = await excluirConta(req.cidadao.id, senha)
  if (resultado.erro === 'senha_invalida') {
    throw credenciaisInvalidas('Senha inválida. A conta não foi excluída.')
  }
  if (resultado.erro) throw validacao({}, 'Não foi possível excluir a conta.')
  limparCookieCidadao(res)
  return res.json({ dados: { ok: true } })
}
