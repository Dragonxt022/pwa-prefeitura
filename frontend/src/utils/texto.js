const URL_REGEX = /https?:\/\/[^\s<>"']+/gi
const PONTUACAO_FINAL = /[.,;:!?)\]}]+$/

/**
 * Divide um texto em trechos comuns e URLs http/https.
 * A pontuação imediatamente após a URL permanece no texto, não no link.
 */
export function partesComLinks(texto) {
  const partes = []
  const conteudo = String(texto ?? '')
  let ultimo = 0
  let encontrado

  while ((encontrado = URL_REGEX.exec(conteudo)) !== null) {
    if (encontrado.index > ultimo) {
      partes.push({ tipo: 'texto', valor: conteudo.slice(ultimo, encontrado.index) })
    }

    let url = encontrado[0]
    let sufixo = ''
    const pontuacao = url.match(PONTUACAO_FINAL)
    if (pontuacao) {
      sufixo = pontuacao[0]
      url = url.slice(0, -sufixo.length)
    }

    partes.push({ tipo: 'link', valor: url })
    if (sufixo) partes.push({ tipo: 'texto', valor: sufixo })
    ultimo = encontrado.index + encontrado[0].length
  }

  if (ultimo < conteudo.length) {
    partes.push({ tipo: 'texto', valor: conteudo.slice(ultimo) })
  }

  return partes
}
