/**
 * Orquestra a classificação automática.
 *
 * A criação da solicitação nunca espera o modelo: entra na fila, é salva com a
 * classificação por regras e a sugestão da IA é aplicada depois. Assim uma
 * fila grande não bloqueia o cidadão nem derruba o servidor.
 */
import { listarSetores } from '../dominio/catalogo.js'
import { normalizarConfiguracoes } from '../dominio/configuracoes.js'
import { classificarSolicitacao, MODELO_TRIAGEM } from '../dominio/triagem.js'
import * as filaBanco from '../repositorios/fila-triagem.js'
import {
  atualizarSolicitacao as atualizarSolicitacaoBanco,
  buscarSolicitacao as buscarSolicitacaoBanco,
  carregarConfiguracoes,
} from '../repositorios/mysql-dados.js'
import { mysqlConfigurado } from '../repositorios/mysql.js'
import * as repositorioSolicitacoes from '../repositorios/solicitacoes.js'
import { obterConfiguracoes } from './configuracoes.js'
import { criarFilaProcessamento } from './fila-triagem.js'
import { classificarComModelo } from './ia.js'

const LIMITE_AVISO = Math.max(1, Number(process.env.TRIAGEM_FILA_AVISO) || 2)
const MAXIMO_FILA = Math.max(LIMITE_AVISO, Number(process.env.TRIAGEM_FILA_MAX) || 20)
const CONCORRENCIA = Math.max(1, Number(process.env.TRIAGEM_FILA_CONCORRENCIA) || 1)

/**
 * Lê a configuração de IA do banco quando disponível. Assim uma instância que
 * ainda não recarregou o cache não processa a fila com configuração antiga.
 */
async function configuracaoIA() {
  if (!mysqlConfigurado) return obterConfiguracoes().ia
  const dados = await carregarConfiguracoes().catch(() => null)
  if (!dados) return obterConfiguracoes().ia
  return normalizarConfiguracoes(dados).ia
}

function iaAtiva(config) {
  return Boolean(config?.ativo && config.provedor !== 'regras')
}

async function lerSolicitacao(protocolo) {
  if (!mysqlConfigurado) return repositorioSolicitacoes.buscar(protocolo)
  return buscarSolicitacaoBanco(protocolo)
}

async function gravarSolicitacao(solicitacao) {
  if (!mysqlConfigurado) return repositorioSolicitacoes.salvar(solicitacao)
  await atualizarSolicitacaoBanco(solicitacao)
  repositorioSolicitacoes.atualizarCache(solicitacao)
  return solicitacao
}

async function processarTriagem(protocolo) {
  const config = await configuracaoIA()
  if (!iaAtiva(config)) return

  const inicial = await lerSolicitacao(protocolo)
  if (!inicial) return
  const setores = listarSetores()

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
    const atual = await lerSolicitacao(protocolo)
    if (!atual) return
    atual.triagem = {
      ...(atual.triagem ?? {}),
      fila: {
        status: 'erro',
        em: new Date().toISOString(),
        erro: String(erro?.message || 'Falha ao consultar o modelo.').slice(0, 300),
      },
    }
    await gravarSolicitacao(atual)
    return
  }

  // Relê o pedido depois da inferência: o status ou o setor podem ter mudado
  // enquanto o modelo respondia.
  const atual = await lerSolicitacao(protocolo)
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

  await gravarSolicitacao(atual)
}

const filaMemoria = criarFilaProcessamento({
  concorrencia: CONCORRENCIA,
  limiteAviso: LIMITE_AVISO,
  maximo: MAXIMO_FILA,
  executor: processarTriagem,
})

function metricas({ pendentes = 0, processando = 0 }) {
  const total = pendentes + processando
  return {
    pendentes,
    processando,
    total,
    limiteAviso: LIMITE_AVISO,
    maximo: MAXIMO_FILA,
    aviso: total >= LIMITE_AVISO,
  }
}

/** Estado público da fila, usado pelo aviso no formulário e pelo painel. */
export async function estadoFilaTriagem() {
  const ativo = iaAtiva(await configuracaoIA())
  if (!mysqlConfigurado) {
    return { ativo, ...filaMemoria.estado() }
  }
  return { ativo, ...metricas(await filaBanco.contar()) }
}

let drenandoBanco = false

async function drenarFilaBanco() {
  if (!mysqlConfigurado || drenandoBanco) return
  drenandoBanco = true
  try {
    while (true) {
      const { executou, resultado } = await filaBanco.processarProximo(processarTriagem)
      if (!executou || !resultado) break
    }
  } catch (erro) {
    console.warn('[triagem] falha ao processar a fila persistida:', erro?.message)
  } finally {
    drenandoBanco = false
  }
}

/**
 * Prepara a fila persistida: devolve jobs órfãos, limpa histórico antigo e
 * inicia o ciclo que processa um job por vez em todo o conjunto de instâncias.
 */
export async function iniciarFilaTriagem() {
  if (!mysqlConfigurado) return
  try {
    await filaBanco.recuperarOrfaos()
    await filaBanco.limparAntigos()
  } catch (erro) {
    console.warn('[triagem] não foi possível preparar a fila persistida:', erro?.message)
  }
  const timer = setInterval(() => {
    void drenarFilaBanco()
  }, 3000)
  timer.unref?.()
  void drenarFilaBanco()
}

export async function agendarTriagem(protocolo) {
  if (!iaAtiva(await configuracaoIA())) {
    return {
      aceito: false,
      ativo: false,
      motivo: 'ia_desativada',
      ...metricas(await filaBanco.contar().catch(() => ({}))),
    }
  }

  if (!mysqlConfigurado) {
    return { ativo: true, ...filaMemoria.adicionar(protocolo, { chave: protocolo }) }
  }

  const antes = await filaBanco.contar()
  if (antes.pendentes >= MAXIMO_FILA) {
    return {
      aceito: false,
      ativo: true,
      motivo: 'fila_cheia',
      ...metricas(antes),
    }
  }

  const { inserido } = await filaBanco.enfileirar(protocolo)
  void drenarFilaBanco()
  return {
    aceito: true,
    ativo: true,
    duplicado: !inserido,
    ...metricas(await filaBanco.contar()),
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
  const config = await configuracaoIA()
  if (!iaAtiva(config)) {
    return classificarSolicitacao({ ...dados, setores })
  }

  try {
    return await classificarComModelo({
      config,
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
