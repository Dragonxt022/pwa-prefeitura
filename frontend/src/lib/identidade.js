export const IDENTIDADE_PADRAO = {
  nome: 'Prefeitura Digital',
  logo: null,
  icone: null,
  corPrimaria: '#1351B4',
  corSecundaria: '#0F7A55',
  corDestaque: '#D97706',
  telefones: [],
  emails: [],
  redesSociais: [],
  rodape: {
    texto: '© {{anos}} {{nome}}. {{direitos}}',
    anoCriacao: new Date().getFullYear(),
    direitos: 'Todos os direitos reservados.',
  },
}

export const ROTULOS_REDES = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  reddit: 'Reddit',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  site: 'Site',
  outro: 'Outro',
}

function hexParaRgb(hex) {
  const valor = String(hex ?? '').replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(valor)) return null
  return {
    r: Number.parseInt(valor.slice(0, 2), 16),
    g: Number.parseInt(valor.slice(2, 4), 16),
    b: Number.parseInt(valor.slice(4, 6), 16),
  }
}

function rgbParaHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((canal) => Math.max(0, Math.min(255, Math.round(canal))).toString(16).padStart(2, '0'))
    .join('')}`
}

function clarear(hex, fator) {
  const rgb = hexParaRgb(hex)
  if (!rgb) return hex
  return rgbParaHex({
    r: rgb.r + (255 - rgb.r) * fator,
    g: rgb.g + (255 - rgb.g) * fator,
    b: rgb.b + (255 - rgb.b) * fator,
  })
}

function escurecer(hex, fator) {
  const rgb = hexParaRgb(hex)
  if (!rgb) return hex
  return rgbParaHex({ r: rgb.r * (1 - fator), g: rgb.g * (1 - fator), b: rgb.b * (1 - fator) })
}

function comAlfa(hex, alfa) {
  const rgb = hexParaRgb(hex)
  if (!rgb) return `rgba(29, 111, 224, ${alfa})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alfa})`
}

export function montarRodape(identidade = IDENTIDADE_PADRAO) {
  const anoAtual = new Date().getFullYear()
  const anoCriacao = Number(identidade.rodape?.anoCriacao) || anoAtual
  const anos = anoCriacao < anoAtual ? `${anoCriacao}–${anoAtual}` : String(anoAtual)
  const valores = {
    nome: identidade.nome || IDENTIDADE_PADRAO.nome,
    anoAtual: String(anoAtual),
    anoCriacao: String(anoCriacao),
    anos,
    direitos: identidade.rodape?.direitos || '',
  }
  const template = identidade.rodape?.texto || IDENTIDADE_PADRAO.rodape.texto
  return template.replace(/\{\{\s*(nome|anoAtual|anoCriacao|anos|direitos)\s*\}\}/g, (_, chave) => valores[chave] ?? '')
}

function atualizarLinkIcone(seletor, href) {
  if (typeof document === 'undefined') return
  let link = document.head.querySelector(seletor)
  if (!href) {
    if (link) link.remove()
    return
  }
  if (!link) {
    link = document.createElement('link')
    link.rel = seletor.includes('apple') ? 'apple-touch-icon' : 'icon'
    document.head.appendChild(link)
  }
  link.href = href
}

export function aplicarIdentidadeVisual(identidade = IDENTIDADE_PADRAO) {
  if (typeof document === 'undefined') return
  const raiz = document.documentElement
  const primaria = hexParaRgb(identidade.corPrimaria) ? identidade.corPrimaria : IDENTIDADE_PADRAO.corPrimaria
  const secundaria = hexParaRgb(identidade.corSecundaria)
    ? identidade.corSecundaria
    : IDENTIDADE_PADRAO.corSecundaria
  const destaque = hexParaRgb(identidade.corDestaque)
    ? identidade.corDestaque
    : IDENTIDADE_PADRAO.corDestaque

  raiz.style.setProperty('--primaria', primaria)
  raiz.style.setProperty('--primaria-forte', escurecer(primaria, 0.16))
  raiz.style.setProperty('--azul-700', primaria)
  raiz.style.setProperty('--azul-600', clarear(primaria, 0.14))
  raiz.style.setProperty('--identidade-secundaria', secundaria)
  raiz.style.setProperty('--identidade-destaque', destaque)
  raiz.style.setProperty('--foco', `0 0 0 4px ${comAlfa(primaria, 0.22)}`)

  const metaTema = document.querySelector('meta[name="theme-color"]')
  if (metaTema) metaTema.setAttribute('content', primaria)

  const icone = identidade.icone || identidade.logo
  atualizarLinkIcone('link[rel="icon"]', icone || '/icons/favicon-32.png')
  atualizarLinkIcone(
    'link[rel="apple-touch-icon"]',
    icone || '/icons/apple-touch-icon-180.png',
  )

  if (identidade.nome) {
    document.title = `${identidade.nome} - Atendimento ao cidadão`
  }
}
