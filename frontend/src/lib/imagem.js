const TAMANHO_MAXIMO_ARQUIVO = 8 * 1024 * 1024
const LADO_MAXIMO = 1280
const LIMITE_DATA_URL = 1_700_000

function carregarImagem(url) {
  return new Promise((resolve, reject) => {
    const imagem = new Image()
    imagem.onload = () => resolve(imagem)
    imagem.onerror = () => reject(new Error('Não foi possível abrir esta imagem.'))
    imagem.src = url
  })
}

/**
 * Reencoda a foto no cliente. Além de reduzir o tamanho, o canvas remove
 * metadados EXIF (inclusive localização) antes do envio.
 */
export async function prepararFoto(arquivo) {
  if (!arquivo) throw new Error('Escolha uma foto.')
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem.')
  }
  if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
    throw new Error('A foto deve ter no máximo 8 MB.')
  }

  const url = URL.createObjectURL(arquivo)
  try {
    const imagem = await carregarImagem(url)
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height))
    const largura = Math.max(1, Math.round(imagem.width * escala))
    const altura = Math.max(1, Math.round(imagem.height * escala))
    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    const contexto = canvas.getContext('2d')
    contexto.fillStyle = '#ffffff'
    contexto.fillRect(0, 0, largura, altura)
    contexto.drawImage(imagem, 0, 0, largura, altura)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.72)
    if (dataUrl.length > LIMITE_DATA_URL) {
      throw new Error('A foto ficou muito grande. Tente outra imagem.')
    }
    return { dataUrl, largura, altura }
  } finally {
    URL.revokeObjectURL(url)
  }
}
