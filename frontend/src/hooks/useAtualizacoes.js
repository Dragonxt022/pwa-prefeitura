import { useCallback, useEffect, useMemo, useState } from 'react'
import { consultarStatus } from '../servicos/api'
import {
  adicionarNotificacao,
  atualizarPedido,
  contarNotificacoesNaoLidas,
  listarPedidos,
  marcarNotificacoesLidas,
} from '../servicos/consultas'
import { useOnlineStatus } from './useOnlineStatus'

function mostrarNotificacaoDoNavegador(protocolo, descricao) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    const notificacao = new Notification('Protocolo atualizado', {
      body: `${protocolo}: ${descricao}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/favicon-32.png',
      tag: `prefeitura-${protocolo}`,
    })
    notificacao.onclick = () => {
      window.focus()
      window.location.assign(`/acompanhar?protocolo=${encodeURIComponent(protocolo)}`)
    }
  } catch {
    // Navegadores podem bloquear a notificação mesmo com permissão concedida.
  }
}

/**
 * Atualiza o status dos protocolos salvos e gera avisos locais.
 * Não é push em segundo plano: a verificação acontece com o app aberto/online.
 */
export function useAtualizacoes() {
  const online = useOnlineStatus()
  const [pedidos, setPedidos] = useState(listarPedidos)
  const [naoLidas, setNaoLidas] = useState(contarNotificacoesNaoLidas)

  const sincronizarContagem = useCallback(() => {
    setNaoLidas(contarNotificacoesNaoLidas())
  }, [])

  const verificar = useCallback(async () => {
    if (!online) return
    const salvos = listarPedidos()
    if (salvos.length === 0) return

    const respostas = await Promise.allSettled(
      salvos.map(async (pedido) => {
        const status = await consultarStatus(pedido.protocolo)
        return { pedido, status }
      }),
    )

    let mudou = false
    for (const resposta of respostas) {
      if (resposta.status !== 'fulfilled') continue
      const { pedido, status } = resposta.value
      if (!status?.atualizadoEm || status.atualizadoEm === pedido.atualizadoEm) continue

      const notificacao = {
        id: `status:${pedido.protocolo}:${status.atualizadoEm}`,
        protocolo: pedido.protocolo,
        tipo: 'status',
        titulo: 'Protocolo atualizado',
        descricao: `${pedido.protocolo}: ${status.statusDescricao}`,
        status: status.status,
        em: new Date().toISOString(),
        lida: false,
      }
      adicionarNotificacao(notificacao)
      atualizarPedido({ ...pedido, ...status })
      mostrarNotificacaoDoNavegador(pedido.protocolo, status.statusDescricao)
      mudou = true
    }

    if (mudou) {
      setPedidos(listarPedidos())
      sincronizarContagem()
      window.dispatchEvent(new CustomEvent('prefeitura:notificacoes'))
    }
  }, [online, sincronizarContagem])

  useEffect(() => {
    verificar()
  }, [verificar])

  useEffect(() => {
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === 'visible') verificar()
    }
    const aoAtualizar = () => {
      setPedidos(listarPedidos())
      sincronizarContagem()
    }

    const intervalo = window.setInterval(() => {
      if (document.visibilityState === 'visible') verificar()
    }, 60_000)

    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    window.addEventListener('prefeitura:notificacoes', aoAtualizar)
    window.addEventListener('prefeitura:fila', aoAtualizar)
    return () => {
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
      window.removeEventListener('prefeitura:notificacoes', aoAtualizar)
      window.removeEventListener('prefeitura:fila', aoAtualizar)
    }
  }, [verificar, sincronizarContagem])

  const marcarLidas = useCallback(() => {
    marcarNotificacoesLidas()
    setNaoLidas(0)
    window.dispatchEvent(new CustomEvent('prefeitura:notificacoes'))
  }, [])

  return useMemo(
    () => ({ naoLidas, pedidos, verificar, marcarLidas }),
    [naoLidas, pedidos, verificar, marcarLidas],
  )
}
