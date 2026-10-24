import { createContext, useContext, useEffect, useMemo } from 'react'
import ptBR from './pt-BR.js'

/**
 * Idiomas habilitados no momento. Os próximos códigos previstos são:
 * en, es, it e pt-PT. Mantenha apenas pt-BR até a revisão dos textos.
 */
export const IDIOMAS = [{ id: 'pt-BR', rotulo: 'Português (Brasil)' }]
export const IDIOMA_PADRAO = 'pt-BR'

const DICIONARIOS = {
  'pt-BR': ptBR,
}

const I18nContext = createContext(null)

function interpolar(texto, variaveis) {
  if (!variaveis) return texto
  return texto.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (original, chave) =>
    Object.prototype.hasOwnProperty.call(variaveis, chave) ? String(variaveis[chave]) : original,
  )
}

function traduzir(dicionario, chave, variaveis) {
  const base = DICIONARIOS[IDIOMA_PADRAO]?.[chave]
  const texto = dicionario?.[chave] ?? base ?? chave
  return interpolar(texto, variaveis)
}

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

export function useI18n() {
  const contexto = useContext(I18nContext)
  if (!contexto) {
    throw new Error('useI18n precisa estar dentro de I18nProvider.')
  }
  return contexto
}
