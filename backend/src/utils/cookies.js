/** Leitura e gravação de cookies simples usados nas sessões da aplicação. */

export function lerCookie(req, nome) {
  const cabecalho = req.get('cookie') || ''
  for (const parte of cabecalho.split(';')) {
    const [chave, ...resto] = parte.trim().split('=')
    if (chave === nome) {
      try {
        return decodeURIComponent(resto.join('='))
      } catch {
        return resto.join('=')
      }
    }
  }
  return ''
}

export function definirCookie(res, nome, valor, {
  maxAgeSegundos = null,
  seguro = false,
  httpOnly = true,
  sameSite = 'Lax',
  caminho = '/',
} = {}) {
  const atributos = [
    `${nome}=${encodeURIComponent(valor)}`,
    `Path=${caminho}`,
    `SameSite=${sameSite}`,
  ]
  if (httpOnly) atributos.push('HttpOnly')
  if (seguro) atributos.push('Secure')
  if (maxAgeSegundos) atributos.push(`Max-Age=${Math.floor(maxAgeSegundos)}`)
  res.append('Set-Cookie', atributos.join('; '))
}

export function limparCookie(res, nome, { seguro = false, caminho = '/' } = {}) {
  const atributos = [
    `${nome}=`,
    `Path=${caminho}`,
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]
  if (seguro) atributos.push('Secure')
  res.append('Set-Cookie', atributos.join('; '))
}
