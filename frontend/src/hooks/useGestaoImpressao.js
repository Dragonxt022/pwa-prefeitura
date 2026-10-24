import { useCallback, useEffect, useState } from 'react'
import { descreverFiltros } from '../utils/gestao'

export function useGestaoImpressao({ filtros, servicos, setores, definirErro }) {
  const [impressao, setImpressao] = useState(null)

  useEffect(() => {
    if (!impressao) return undefined
    const timer = window.setTimeout(() => {
      window.print()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [impressao])

  const limpar = useCallback(() => {
    setImpressao(null)
  }, [])

  function imprimir(itens, rotulo) {
    if (itens.length === 0) {
      definirErro(new Error('Selecione ao menos uma solicitação para imprimir.'))
      return
    }
    definirErro(null)
    setImpressao({
      itens,
      rotulo,
      criadoEm: new Date().toISOString(),
      filtros: descreverFiltros(filtros, servicos, setores),
    })
  }

  return { impressao, limpar, imprimir }
}
