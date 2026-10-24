import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { obterConfiguracoesPublicas } from '../servicos/api'
import {
  aplicarIdentidadeVisual,
  IDENTIDADE_PADRAO,
  montarRodape,
} from '../utils/identidade'

const ConfiguracoesContext = createContext(null)

export function ConfiguracoesProvider({ children }) {
  const [identidade, setIdentidade] = useState(IDENTIDADE_PADRAO)
  const [carregada, setCarregada] = useState(false)

  const recarregarConfiguracoes = useCallback(async () => {
    try {
      const resposta = await obterConfiguracoesPublicas()
      if (resposta?.identidade) setIdentidade(resposta.identidade)
      return resposta?.identidade ?? null
    } catch {
      return null
    } finally {
      setCarregada(true)
    }
  }, [])

  useEffect(() => {
    void recarregarConfiguracoes()
  }, [recarregarConfiguracoes])

  useEffect(() => {
    aplicarIdentidadeVisual(identidade)
  }, [identidade])

  const valor = useMemo(
    () => ({
      identidade,
      carregada,
      recarregarConfiguracoes,
      rodape: montarRodape(identidade),
    }),
    [identidade, carregada, recarregarConfiguracoes],
  )

  return (
    <ConfiguracoesContext.Provider value={valor}>{children}</ConfiguracoesContext.Provider>
  )
}

export function useConfiguracoes() {
  const contexto = useContext(ConfiguracoesContext)
  if (!contexto) {
    throw new Error('useConfiguracoes precisa estar dentro de ConfiguracoesProvider.')
  }
  return contexto
}
