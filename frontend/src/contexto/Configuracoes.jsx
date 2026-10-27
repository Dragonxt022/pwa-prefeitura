import { useCallback, useEffect, useMemo } from 'react'
import { useRecurso } from '../hooks/useRecurso'
import { obterConfiguracoesPublicas } from '../servicos/api'
import {
  aplicarIdentidadeVisual,
  IDENTIDADE_PADRAO,
  montarRodape,
} from '../utils/identidade'
import { ConfiguracoesContext } from './contextoConfiguracoes.js'

export function ConfiguracoesProvider({ children }) {
  const { dados, carregando, recarregar } = useRecurso(obterConfiguracoesPublicas, [])
  const identidade = dados?.identidade ?? IDENTIDADE_PADRAO
  const carregada = !carregando

  const recarregarConfiguracoes = useCallback(async () => {
    recarregar()
  }, [recarregar])

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
