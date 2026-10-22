import { criarSolicitacao } from './api'
import {
  adicionarNotificacao,
  registrarConsulta,
  registrarPedido,
} from './consultas'

const CHAVE = 'prefeitura:fila'
const CHAVE_ENVIADOS = 'prefeitura:fila-enviada'
let processando = null

function notificar() {
  window.dispatchEvent(new CustomEvent('prefeitura:fila'))
}

function ler() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? '[]')
    return Array.isArray(bruto) ? bruto.filter((item) => item?.clientId && item?.payload) : []
  } catch {
    return []
  }
}

function salvar(itens) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens))
  } catch {
    // Sem espaço: a fila não pode ser persistida.
  }
}

export function listarFila() {
  return ler()
}

export function enfileirar(payload) {
  const item = {
    clientId: payload.clientId,
    criadoEm: new Date().toISOString(),
    payload,
  }
  salvar([item, ...ler().filter((atual) => atual.clientId !== item.clientId)])
  notificar()
  return item
}

export function removerDaFila(clientId) {
  salvar(ler().filter((item) => item.clientId !== clientId))
  notificar()
}

export function limparFila() {
  salvar([])
  notificar()
}

export function ultimoEnvio() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_ENVIADOS) ?? 'null')
  } catch {
    return null
  }
}

/**
 * Tenta enviar a fila quando a conexão volta. A API usa clientId para que
 * um reenvio depois de resposta perdida não duplique o protocolo.
 */
export function processarFila() {
  if (processando) return processando
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return Promise.resolve({ enviados: 0, pendentes: listarFila().length, offline: true })
  }

  processando = (async () => {
    const fila = listarFila()
    let enviados = 0
    let erro = null

    for (const item of fila) {
      try {
        const criada = await criarSolicitacao(item.payload)
        registrarConsulta(criada.protocolo)
        registrarPedido(criada)
        adicionarNotificacao({
          id: `envio:${criada.protocolo}`,
          protocolo: criada.protocolo,
          tipo: 'envio',
          titulo: 'Pedido enviado',
          descricao: `${criada.protocolo} foi enviado ao atendimento.`,
          em: new Date().toISOString(),
          lida: false,
        })
        removerDaFila(item.clientId)
        try {
          localStorage.setItem(
            CHAVE_ENVIADOS,
            JSON.stringify({
              protocolo: criada.protocolo,
              em: new Date().toISOString(),
            }),
          )
        } catch {
          // ignorar
        }
        enviados += 1
      } catch (falha) {
        erro = falha
        if (falha?.offline) break
        // Erros de validação não melhoram com novas tentativas automáticas.
        if (falha?.status >= 400 && falha?.status < 500) removerDaFila(item.clientId)
      }
    }

    notificar()
    return { enviados, pendentes: listarFila().length, erro }
  })().finally(() => {
    processando = null
  })

  return processando
}
