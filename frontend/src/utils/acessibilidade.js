const CHAVE = 'prefeitura:acessibilidade'
const PADRAO = { fonte: 'normal', contraste: false, tema: 'auto' }

function normalizarTema(tema) {
  return tema === 'claro' || tema === 'escuro' ? tema : 'auto'
}

export function lerPreferenciasAcessibilidade() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? 'null')
    return {
      fonte: salvo?.fonte === 'grande' ? 'grande' : 'normal',
      contraste: Boolean(salvo?.contraste),
      tema: normalizarTema(salvo?.tema),
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

  const tema = normalizarTema(preferencias.tema)
  if (tema === 'auto') delete raiz.dataset.tema
  else raiz.dataset.tema = tema
}

export function salvarPreferenciasAcessibilidade(preferencias) {
  const normalizadas = {
    fonte: preferencias.fonte === 'grande' ? 'grande' : 'normal',
    contraste: Boolean(preferencias.contraste),
    tema: normalizarTema(preferencias.tema),
  }
  try {
    localStorage.setItem(CHAVE, JSON.stringify(normalizadas))
  } catch {
    // Preferência não persiste em modo privado, mas continua aplicada na sessão.
  }
  aplicarPreferenciasAcessibilidade(normalizadas)
  window.dispatchEvent(new CustomEvent('prefeitura:acessibilidade', { detail: normalizadas }))
  return normalizadas
}
