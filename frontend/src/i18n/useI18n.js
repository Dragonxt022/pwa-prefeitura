import { useContext } from 'react'
import { I18nContext } from './contexto.js'

export function useI18n() {
  const contexto = useContext(I18nContext)
  if (!contexto) {
    throw new Error('useI18n precisa estar dentro de I18nProvider.')
  }
  return contexto
}
