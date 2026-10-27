import { createContext } from 'react'
import ptBR from './pt-BR.js'

/**
 * Idiomas habilitados no momento. Os próximos códigos previstos são:
 * en, es, it e pt-PT. Mantenha apenas pt-BR até a revisão dos textos.
 */
export const IDIOMAS = [{ id: 'pt-BR', rotulo: 'Português (Brasil)' }]
export const IDIOMA_PADRAO = 'pt-BR'

export const DICIONARIOS = {
  'pt-BR': ptBR,
}

export const I18nContext = createContext(null)

function interpolar(texto, variaveis) {
  if (!variaveis) return texto
  return texto.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (original, chave) =>
    Object.prototype.hasOwnProperty.call(variaveis, chave) ? String(variaveis[chave]) : original,
  )
}

export function traduzir(dicionario, chave, variaveis) {
  const base = DICIONARIOS[IDIOMA_PADRAO]?.[chave]
  const texto = dicionario?.[chave] ?? base ?? chave
  return interpolar(texto, variaveis)
}
