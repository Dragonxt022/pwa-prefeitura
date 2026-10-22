import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Executa um carregamento assíncrono e expõe dados/erro/carregando + recarregar().
 * O resultado é descartado se o componente desmontar antes da resposta.
 */
export function useRecurso(carregar, deps = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null })
  const [gatilho, setGatilho] = useState(0)
  const carregarRef = useRef(carregar)
  carregarRef.current = carregar

  useEffect(() => {
    let ativo = true
    setEstado((anterior) => ({ ...anterior, carregando: true, erro: null }))

    carregarRef
      .current()
      .then((dados) => {
        if (ativo) setEstado({ dados, carregando: false, erro: null })
      })
      .catch((erro) => {
        if (ativo) setEstado({ dados: null, carregando: false, erro })
      })

    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, gatilho])

  const recarregar = useCallback(() => setGatilho((valor) => valor + 1), [])

  return { ...estado, recarregar }
}
