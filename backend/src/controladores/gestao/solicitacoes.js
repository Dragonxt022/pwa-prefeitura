/**
 * Controllers de solicitações no painel de gestão.
 */
import { apresentarSolicitacaoGestao } from '../../apresentadores/solicitacoes.js'
import { setorPublico } from '../../dominio/catalogo.js'
import { naoEncontrado, semPermissao, validacao } from '../../utils/erros.js'
import {
  podeAcessarSolicitacao,
  setorDoFiltro,
} from '../../middlewares/autenticacao.js'
import { notificarEvento } from '../../servicos/notificacoes.js'
import {
  atualizarStatus as atualizarStatusServico,
  buscarSolicitacao,
  estatisticasGestao,
  listarSolicitacoes,
  transferirSolicitacao,
} from '../../servicos/solicitacoes.js'
import { triagemAutomaticaAtiva } from '../../servicos/configuracoes.js'
import { texto } from '../../utils/texto.js'
import {
  validarAtualizacaoStatus,
  validarTransferencia,
} from '../../validadores/solicitacoes.js'

export function listar(req, res) {
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
    dados: dados.map(apresentarSolicitacaoGestao),
    total,
    estatisticas: estatisticasGestao({ setorId }),
    triagemAutomatica: triagemAutomaticaAtiva(),
  })
}

export function detalhar(req, res) {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')
  if (!podeAcessarSolicitacao(req.usuario, solicitacao)) {
    throw semPermissao('Esta solicitação pertence a outro setor.')
  }
  res.json({ dados: apresentarSolicitacaoGestao(solicitacao) })
}

export function atualizarStatus(req, res) {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')
  if (!podeAcessarSolicitacao(req.usuario, solicitacao)) {
    throw semPermissao('Esta solicitação pertence a outro setor.')
  }

  const dados = validarAtualizacaoStatus(req.body)
  const atualizada = atualizarStatusServico(solicitacao.protocolo, {
    ...dados,
    porUsuario: req.usuario,
  })

  const evento = ['concluida', 'indeferida'].includes(dados.status)
    ? 'conclusao'
    : 'mudanca_status'
  void notificarEvento(evento, {
    protocolo: atualizada.protocolo,
    tipo: atualizada.tipo,
    tipoTitulo: atualizada.tipoTitulo,
    setorNome: setorPublico(atualizada.setorId)?.nome,
    status: atualizada.status,
    endereco: atualizada.endereco,
    descricao: atualizada.descricao,
    detalhe: dados.observacao || (dados.prioridade ? `Prioridade alterada para ${dados.prioridade}.` : null),
  }).catch((erro) => console.warn('[notificacao]', erro.message))

  res.json({
    dados: apresentarSolicitacaoGestao(atualizada),
    estatisticas: estatisticasGestao({ setorId: setorDoFiltro(req) }),
  })
}

export function transferir(req, res) {
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao) throw naoEncontrado('Solicitação não encontrada.')
  if (!podeAcessarSolicitacao(req.usuario, solicitacao)) {
    throw semPermissao('Você só pode transferir solicitações do seu setor.')
  }

  const dados = validarTransferencia(req.body, solicitacao)
  const resultado = transferirSolicitacao(solicitacao.protocolo, {
    ...dados,
    porUsuario: req.usuario,
  })

  if (resultado.erro) {
    throw validacao({}, 'Não foi possível transferir a solicitação.')
  }

  const deSetor = setorPublico(resultado.transferencia.deSetorId)?.nome ?? 'Triagem'
  const paraSetor = setorPublico(resultado.transferencia.paraSetorId)?.nome ?? dados.setorDestinoId
  void notificarEvento('transferencia', {
    protocolo: resultado.solicitacao.protocolo,
    tipo: resultado.solicitacao.tipo,
    tipoTitulo: resultado.solicitacao.tipoTitulo,
    setorNome: paraSetor,
    status: resultado.solicitacao.status,
    endereco: resultado.solicitacao.endereco,
    descricao: resultado.solicitacao.descricao,
    detalhe: `Transferida de ${deSetor} para ${paraSetor}.${dados.motivo ? ` Motivo: ${dados.motivo}` : ''}`,
  }).catch((erro) => console.warn('[notificacao]', erro.message))

  res.json({
    dados: apresentarSolicitacaoGestao(resultado.solicitacao),
    estatisticas: estatisticasGestao({ setorId: setorDoFiltro(req) }),
  })
}
