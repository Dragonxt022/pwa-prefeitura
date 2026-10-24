import { useEffect, useState } from 'react'
import { listarFila, processarFila, ultimoEnvio } from '../servicos/fila'

function estadoAtual() {
  return { pendentes: listarFila().length, ultimo: ultimoEnvio() }
}

/**
 * Dispara a fila offline quando a conexão volta e mantém o aviso global.
 */
export function useFilaSolicitacoes() {
  const [estado, setEstado] = useState(estadoAtual)

  useEffect(() => {
    let ativo = true

    const atualizar = () => {
      if (ativo) setEstado(estadoAtual())
    }

    const tentar = () => {
      if (!navigator.onLine) return
      processarFila().then(atualizar).catch(() => atualizar())
    }

    window.addEventListener('online', tentar)
    window.addEventListener('prefeitura:fila', atualizar)
    const intervalo = window.setInterval(tentar, 30_000)
    tentar()

    return () => {
      ativo = false
      window.clearInterval(intervalo)
      window.removeEventListener('online', tentar)
      window.removeEventListener('prefeitura:fila', atualizar)
    }
  }, [])

  return estado
}
