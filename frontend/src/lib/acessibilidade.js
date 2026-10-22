const CHAVE = 'prefeitura:acessibilidade'
const PADRAO = { fonte: 'normal', contraste: false }

export function lerPreferenciasAcessibilidade() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? 'null')
    return {
      fonte: salvo?.fonte === 'grande' ? 'grande' : 'normal',
      contraste: Boolean(salvo?.contraste),
    }
  } catch {
    return { ...PADRAO }
  }
}

export function aplicarPreferenciasAcessibilidade(preferencias = lerPreferenciasAcessibilidade()) {
  const raiz = document.documentElement
  if (preferencias.fonte === 'grande') raiz.dataset.fonte = 'grande'
  else delete raiz.dataset.fonte

  if (preferencias.contraste) raiz.dataset.contraste = 'alto'
  else delete raiz.dataset.contraste
}

export function salvarPreferenciasAcessibilidade(preferencias) {
  const normalizadas = {
    fonte: preferencias.fonte === 'grande' ? 'grande' : 'normal',
    contraste: Boolean(preferencias.contraste),
  }
  try {
    localStorage.setItem(CHAVE, JSON.stringify(normalizadas))
  } catch {
    // Preferência não persiste em modo privado, mas continua aplicada na sessão.
  }
  aplicarPreferenciasAcessibilidade(normalizadas)
  return normalizadas
}
