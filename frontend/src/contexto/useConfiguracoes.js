import { useContext } from 'react'
import { ConfiguracoesContext } from './contextoConfiguracoes.js'

export function useConfiguracoes() {
  const contexto = useContext(ConfiguracoesContext)
  if (!contexto) {
    throw new Error('useConfiguracoes precisa estar dentro de ConfiguracoesProvider.')
  }
  return contexto
}
