/**
 * Orquestra a classificação automática.
 *
 * A criação da solicitação nunca espera o modelo: entra na fila, é salva com a
 * classificação por regras e a sugestão da IA é aplicada depois. Assim uma
 * fila grande não bloqueia o cidadão nem derruba o servidor.
 */
import { listarSetores } from '../dominio/catalogo.js'
import { classificarSolicitacao, MODELO_TRIAGEM } from '../dominio/triagem.js'
import * as repositorioSolicitacoes from '../repositorios/solicitacoes.js'
import { obterConfiguracoes } from './configuracoes.js'
import { criarFilaProcessamento } from './fila-triagem.js'
import { classificarComModelo } from './ia.js'

const LIMITE_AVISO = Math.max(1, Number(process.env.TRIAGEM_FILA_AVISO) || 2)
const MAXIMO_FILA = Math.max(LIMITE_AVISO, Number(process.env.TRIAGEM_FILA_MAX) || 20)
const CONCORRENCIA = Math.max(1, Number(process.env.TRIAGEM_FILA_CONCORRENCIA) || 1)

function iaHabilitada() {
  const ia = obterConfiguracoes().ia
  return Boolean(ia.ativo && ia.provedor !== 'regras')
}

async function processarTriagem(protocolo) {
  if (!iaHabilitada()) return

  const inicial = repositorioSolicitacoes.buscar(protocolo)
  if (!inicial) return
  const setores = listarSetores()
  const config = obterConfiguracoes().ia

  let resultado
  try {
    resultado = await classificarComModelo({
      config,
      solicitacao: {
        tipo: inicial.tipo,
        descricao: inicial.descricao,
        endereco: inicial.endereco,
      },
      setores,
    })
  } catch (erro) {
    // O pedido já está salvo com a classificação por regras; apenas registra a
    // falha para quem acompanha a triagem no painel.
    const atual = repositorioSolicitacoes.buscar(protocolo)
    if (!atual) return
    atual.triagem = {
      ...(atual.triagem ?? {}),
      fila: {
        status: 'erro',
        em: new Date().toISOString(),
        erro: String(erro?.message || 'Falha ao consultar o modelo.').slice(0, 300),
      },
    }
    await repositorioSolicitacoes.salvar(atual)
    return
  }

  // Relê o pedido depois da inferência: o status ou o setor podem ter mudado
  // enquanto o modelo respondia.
  const atual = repositorioSolicitacoes.buscar(protocolo)
  if (!atual) return

  const setorSugerido = setores.find(
    (setor) => setor.id === resultado.setorId && !setor.central && setor.ativo,
  )
  const podeAplicar = Boolean(config.aplicarAutomaticamente && setorSugerido)
  const aindaNoInicio = atual.status === 'recebida' &&
    atual.setorId === (atual.triagem?.setorInicialId ?? 'triagem') &&
    atual.setorId === 'triagem'
  const aplicada = podeAplicar && aindaNoInicio && resultado.confianca >= 0.5
  const agora = new Date().toISOString()

  atual.triagem = {
    ...(atual.triagem ?? {}),
    ...resultado,
    automatica: aplicada,
    aplicada,
    setorSugeridoId: resultado.setorId,
    fila: { status: 'concluida', em: agora },
  }

  if (aplicada) {
    atual.setorId = setorSugerido.id
    atual.atualizadoEm = agora
    atual.historico.push({
      status: atual.status,
      em: agora,
      tipo: 'triagem_ia',
      observacao:
        `Triagem automática (${resultado.modelo}) encaminhou para ${setorSugerido.nome}.`,
    })
  }

  await repositorioSolicitacoes.salvar(atual)
}

const fila = criarFilaProcessamento({
  concorrencia: CONCORRENCIA,
  limiteAviso: LIMITE_AVISO,
  maximo: MAXIMO_FILA,
  executor: processarTriagem,
})

/** Estado público da fila, usado pelo aviso no formulário e pelo painel. */
export function estadoFilaTriagem() {
  return {
    ativo: iaHabilitada(),
    ...fila.estado(),
  }
}

export function agendarTriagem(protocolo) {
  if (!iaHabilitada()) {
    return { aceito: false, ativo: false, motivo: 'ia_desativada', ...fila.estado() }
  }
  return {
    ativo: true,
    ...fila.adicionar(protocolo, { chave: protocolo }),
  }
}

/** Classificação síncrona por regras, usada como ponto de partida. */
export function sugestaoPorRegras(dados) {
  return {
    ...classificarSolicitacao({ ...dados, setores: listarSetores() }),
    modelo: MODELO_TRIAGEM,
  }
}

/**
 * Mantida para consumidores que ainda querem a sugestão imediata. A criação de
 * solicitações não usa esta função para não esperar o modelo.
 */
export async function sugerirClassificacao(dados) {
  const setores = listarSetores()
  if (!iaHabilitada()) {
    return classificarSolicitacao({ ...dados, setores })
  }

  try {
    return await classificarComModelo({
      config: obterConfiguracoes().ia,
      solicitacao: dados,
      setores,
    })
  } catch (erro) {
    return {
      ...classificarSolicitacao({ ...dados, setores }),
      origem: 'regras-fallback',
      modelo: MODELO_TRIAGEM,
      fallback: true,
      erroModelo: String(erro?.message || 'Falha ao consultar o modelo.').slice(0, 300),
    }
  }
}
