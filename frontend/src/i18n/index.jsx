import { useEffect, useMemo } from 'react'
import {
  DICIONARIOS,
  I18nContext,
  IDIOMAS,
  IDIOMA_PADRAO,
  traduzir,
} from './contexto.js'

export function I18nProvider({ children, idioma = IDIOMA_PADRAO }) {
  const idiomaSeguro = DICIONARIOS[idioma] ? idioma : IDIOMA_PADRAO
  const dicionario = DICIONARIOS[idiomaSeguro]

  useEffect(() => {
    document.documentElement.lang = idiomaSeguro
  }, [idiomaSeguro])

  const valor = useMemo(
    () => ({
      idioma: idiomaSeguro,
      idiomas: IDIOMAS,
      t: (chave, variaveis) => traduzir(dicionario, chave, variaveis),
    }),
    [dicionario, idiomaSeguro],
  )

  return <I18nContext.Provider value={valor}>{children}</I18nContext.Provider>
}
