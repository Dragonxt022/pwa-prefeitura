import { useContext } from 'react'
import { CidadaoContext } from './contextoCidadao.js'

export function useCidadao() {
  const contexto = useContext(CidadaoContext)
  if (!contexto) {
    throw new Error('useCidadao precisa estar dentro de CidadaoProvider.')
  }
  return contexto
}
