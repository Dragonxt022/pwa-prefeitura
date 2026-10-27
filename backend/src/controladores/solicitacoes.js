/**
 * Controllers públicos de solicitações.
 *
 * Interpretam a requisição, acionam validação/serviços, disparam notificações
 * e montam a resposta com os apresentadores. Nenhum controller acessa o estado
 * persistido diretamente.
 */
import {
  apresentarSolicitacaoPublica,
  apresentarStatusPublico,
} from '../apresentadores/solicitacoes.js'
import { setorPublico } from '../dominio/catalogo.js'
import { notificarEvento } from '../servicos/notificacoes.js'
import {
  avaliarSolicitacao as avaliarSolicitacaoServico,
  buscarSolicitacao,
  buscarSolicitacaoPorClientId,
  codigoAcessoConfere,
  criarSolicitacao as criarSolicitacaoServico,
  listarSemelhantes as listarSemelhantesServico,
} from '../servicos/solicitacoes.js'
import { sugerirClassificacao } from '../servicos/triagem.js'
import {
  codigoAcessoInvalido,
  jaAvaliada,
  validacao,
} from '../utils/erros.js'
import { texto } from '../utils/texto.js'
import { validarAvaliacao, validarSolicitacao } from '../validadores/solicitacoes.js'

/**
 * Busca protegida: protocolo inexistente e código incorreto têm a mesma
 * resposta, para não confirmar a existência de um pedido a terceiros.
 */
function buscarComCodigo(req) {
  const codigo = req.get('x-codigo-acesso')
  const solicitacao = buscarSolicitacao(req.params.protocolo)
  if (!solicitacao || !codigoAcessoConfere(solicitacao, codigo)) {
    throw codigoAcessoInvalido()
  }
  return solicitacao
}

export function listarSemelhantes(req, res) {
  const dados = listarSemelhantesServico({
    tipo: texto(req.query.tipo),
    endereco: texto(req.query.endereco),
    latitude: req.query.latitude,
    longitude: req.query.longitude,
  })
  res.json({ dados })
}

export async function criar(req, res) {
  const dados = validarSolicitacao(req.body)
  const existente = buscarSolicitacaoPorClientId(dados.clientId)
  if (existente) {
    if (!codigoAcessoConfere(existente, dados.codigoAcesso)) throw codigoAcessoInvalido()
    return res.status(200).json({ dados: apresentarSolicitacaoPublica(existente), criada: false })
  }

  const sugestao = await sugerirClassificacao(dados)
  const { solicitacao, criada, acessoNegado } = criarSolicitacaoServico({
    ...dados,
    sugestao,
  })
  if (acessoNegado) throw codigoAcessoInvalido()
  if (criada) {
    void notificarEvento('nova_solicitacao', {
      protocolo: solicitacao.protocolo,
      tipo: solicitacao.tipo,
      tipoTitulo: solicitacao.tipoTitulo,
      setorNome: setorPublico(solicitacao.setorId)?.nome,
      status: solicitacao.status,
      endereco: solicitacao.endereco,
      descricao: solicitacao.descricao,
      detalhe: solicitacao.triagem?.automatica
        ? `Triagem automática aplicada (${solicitacao.triagem.origem ?? 'regras'}).`
        : 'Aguardando triagem manual.',
    }).catch((erro) => console.warn('[notificacao]', erro.message))
  }
  return res
    .status(criada ? 201 : 200)
    .json({ dados: apresentarSolicitacaoPublica(solicitacao), criada })
}

export function avaliar(req, res) {
  const solicitacao = buscarComCodigo(req)
  if (solicitacao.status !== 'concluida') {
    throw validacao({
      avaliacao: 'A avaliação fica disponível após a conclusão do atendimento.',
    })
  }
  if (solicitacao.avaliacao) {
    throw jaAvaliada()
  }

  const dados = validarAvaliacao(req.body)
  const atualizada = avaliarSolicitacaoServico(solicitacao.protocolo, dados)
  void notificarEvento('avaliacao', {
    protocolo: atualizada.protocolo,
    tipo: atualizada.tipo,
    tipoTitulo: atualizada.tipoTitulo,
    setorNome: setorPublico(atualizada.setorId)?.nome,
    status: atualizada.status,
    nota: dados.nota,
    comentario: dados.comentario,
  }).catch((erro) => console.warn('[notificacao]', erro.message))
  return res.status(201).json({ dados: apresentarSolicitacaoPublica(atualizada) })
}

export function detalhar(req, res) {
  const solicitacao = buscarComCodigo(req)
  res.json({ dados: apresentarSolicitacaoPublica(solicitacao) })
}

export function obterStatus(req, res) {
  const solicitacao = buscarComCodigo(req)
  res.json({ dados: apresentarStatusPublico(solicitacao) })
}
