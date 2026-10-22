/**
 * Gera os icones do PWA, o favicon e as versoes do logo oficial usadas no
 * cabecalho. Os arquivos-fonte ficam em doc/imagens/logos.
 * Uso: npm run icons
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync, inflateSync } from 'node:zlib'

const raizFrontend = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const raiz = resolve(raizFrontend, '..')
const origemLogos = resolve(raiz, 'doc/imagens/logos')
const destinoIcones = resolve(raizFrontend, 'public/icons')
const destinoAssets = resolve(raizFrontend, 'src/assets')

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    tabela[n] = c >>> 0
  }
  return tabela
})()

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(tipo, dados) {
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([tamanho, corpo, crc])
}

function codificarPng(largura, altura, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largura, 0)
  ihdr.writeUInt32BE(altura, 4)
  ihdr[8] = 8 // profundidade
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const linhaBytes = largura * 4 + 1
  const cru = Buffer.alloc(linhaBytes * altura)
  for (let y = 0; y < altura; y += 1) {
    const offset = y * linhaBytes
    cru[offset] = 0 // filtro none
    rgba.copy(cru, offset + 1, y * largura * 4, (y + 1) * largura * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(cru, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

function desfiltrar(linha, anterior, bpp, filtro) {
  for (let i = 0; i < linha.length; i += 1) {
    const esquerda = i >= bpp ? linha[i - bpp] : 0
    const acima = anterior[i] ?? 0
    const diagonal = i >= bpp ? anterior[i - bpp] : 0

    if (filtro === 1) linha[i] = (linha[i] + esquerda) & 0xff
    else if (filtro === 2) linha[i] = (linha[i] + acima) & 0xff
    else if (filtro === 3) linha[i] = (linha[i] + ((esquerda + acima) >> 1)) & 0xff
    else if (filtro === 4) linha[i] = (linha[i] + paeth(esquerda, acima, diagonal)) & 0xff
    else if (filtro !== 0) throw new Error(`Filtro PNG desconhecido: ${filtro}`)
  }
}

function decodificarPng(caminho) {
  const buffer = readFileSync(caminho)
  const assinatura = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (!buffer.subarray(0, 8).equals(assinatura)) throw new Error(`${caminho} nao e um PNG`)

  let offset = 8
  let largura = 0
  let altura = 0
  let profundidade = 0
  let cor = 0
  let entrelacado = 0
  const partes = []

  while (offset < buffer.length) {
    const tamanho = buffer.readUInt32BE(offset)
    const tipo = buffer.toString('ascii', offset + 4, offset + 8)
    const dados = buffer.subarray(offset + 8, offset + 8 + tamanho)

    if (tipo === 'IHDR') {
      largura = dados.readUInt32BE(0)
      altura = dados.readUInt32BE(4)
      profundidade = dados[8]
      cor = dados[9]
      entrelacado = dados[12]
    } else if (tipo === 'IDAT') {
      partes.push(dados)
    } else if (tipo === 'IEND') {
      break
    }

    offset += 12 + tamanho
  }

  if (profundidade !== 8 || cor !== 6 || entrelacado !== 0) {
    throw new Error(`${caminho}: esperado PNG RGBA de 8 bits sem entrelacamento`)
  }

  const cru = inflateSync(Buffer.concat(partes))
  const bpp = 4
  const stride = largura * bpp
  const pixels = Buffer.alloc(stride * altura)
  let anterior = Buffer.alloc(stride)

  for (let y = 0; y < altura; y += 1) {
    const base = y * (stride + 1)
    const filtro = cru[base]
    const linha = Buffer.from(cru.subarray(base + 1, base + 1 + stride))
    desfiltrar(linha, anterior, bpp, filtro)
    linha.copy(pixels, y * stride)
    anterior = linha
  }

  return { largura, altura, dados: pixels }
}

/** Area util do simbolo, ignorando pixels isolados (como o ponto do arquivo original). */
function encontrarSimbolo(imagem) {
  const { largura, altura, dados } = imagem
  const colunas = new Uint32Array(largura)
  const linhas = new Uint32Array(altura)

  for (let y = 0; y < altura; y += 1) {
    for (let x = 0; x < largura; x += 1) {
      if (dados[(y * largura + x) * 4 + 3] > 8) {
        colunas[x] += 1
        linhas[y] += 1
      }
    }
  }

  const minimo = 4
  let minX = 0
  let maxX = largura - 1
  let minY = 0
  let maxY = altura - 1

  while (minX < largura && colunas[minX] < minimo) minX += 1
  while (maxX > minX && colunas[maxX] < minimo) maxX -= 1
  while (minY < altura && linhas[minY] < minimo) minY += 1
  while (maxY > minY && linhas[maxY] < minimo) maxY -= 1

  const conteudo = Math.max(maxX - minX + 1, maxY - minY + 1)
  const margem = Math.round(conteudo * 0.12)
  const lado = conteudo + margem * 2
  const centroX = (minX + maxX + 1) / 2
  const centroY = (minY + maxY + 1) / 2

  const x = Math.min(Math.max(Math.round(centroX - lado / 2), 0), largura - lado)
  const y = Math.min(Math.max(Math.round(centroY - lado / 2), 0), altura - lado)

  return { x, y, lado }
}

function amostrar(imagem, x, y) {
  const px = Math.min(Math.max(x, 0), imagem.largura - 1)
  const py = Math.min(Math.max(y, 0), imagem.altura - 1)
  const offset = (py * imagem.largura + px) * 4
  return {
    r: imagem.dados[offset],
    g: imagem.dados[offset + 1],
    b: imagem.dados[offset + 2],
    a: imagem.dados[offset + 3],
  }
}

/** Redimensiona uma area quadrada preservando o alpha (sem halo escuro). */
function redimensionar(imagem, area, tamanho) {
  const saida = Buffer.alloc(tamanho * tamanho * 4)

  for (let y = 0; y < tamanho; y += 1) {
    for (let x = 0; x < tamanho; x += 1) {
      const sx = area.x + ((x + 0.5) / tamanho) * area.lado - 0.5
      const sy = area.y + ((y + 0.5) / tamanho) * area.lado - 0.5
      const x0 = Math.floor(sx)
      const y0 = Math.floor(sy)
      const tx = sx - x0
      const ty = sy - y0

      const pontos = [
        [amostrar(imagem, x0, y0), (1 - tx) * (1 - ty)],
        [amostrar(imagem, x0 + 1, y0), tx * (1 - ty)],
        [amostrar(imagem, x0, y0 + 1), (1 - tx) * ty],
        [amostrar(imagem, x0 + 1, y0 + 1), tx * ty],
      ]

      let alpha = 0
      let r = 0
      let g = 0
      let b = 0
      for (const [ponto, peso] of pontos) {
        const a = ponto.a * peso
        alpha += a
        r += ponto.r * a
        g += ponto.g * a
        b += ponto.b * a
      }

      const offset = (y * tamanho + x) * 4
      if (alpha > 0) {
        saida[offset] = Math.round(r / alpha)
        saida[offset + 1] = Math.round(g / alpha)
        saida[offset + 2] = Math.round(b / alpha)
        saida[offset + 3] = Math.round(alpha)
      }
    }
  }

  return saida
}

function criarIcone(imagem, area, tamanho, escala) {
  const gradienteTopo = [0x1d, 0x6f, 0xe0]
  const gradienteBase = [0x0c, 0x3a, 0x7e]
  const fundo = Buffer.alloc(tamanho * tamanho * 4)

  for (let y = 0; y < tamanho; y += 1) {
    const t = y / Math.max(tamanho - 1, 1)
    const r = Math.round(gradienteTopo[0] + (gradienteBase[0] - gradienteTopo[0]) * t)
    const g = Math.round(gradienteTopo[1] + (gradienteBase[1] - gradienteTopo[1]) * t)
    const b = Math.round(gradienteTopo[2] + (gradienteBase[2] - gradienteTopo[2]) * t)
    for (let x = 0; x < tamanho; x += 1) {
      const offset = (y * tamanho + x) * 4
      fundo[offset] = r
      fundo[offset + 1] = g
      fundo[offset + 2] = b
      fundo[offset + 3] = 255
    }
  }

  const ladoLogo = Math.round(tamanho * escala)
  const logo = redimensionar(imagem, area, ladoLogo)
  const inicio = Math.floor((tamanho - ladoLogo) / 2)

  for (let y = 0; y < ladoLogo; y += 1) {
    for (let x = 0; x < ladoLogo; x += 1) {
      const origem = (y * ladoLogo + x) * 4
      const destino = ((y + inicio) * tamanho + (x + inicio)) * 4
      const alpha = logo[origem + 3] / 255
      if (alpha === 0) continue
      fundo[destino] = Math.round(logo[origem] * alpha + fundo[destino] * (1 - alpha))
      fundo[destino + 1] = Math.round(logo[origem + 1] * alpha + fundo[destino + 1] * (1 - alpha))
      fundo[destino + 2] = Math.round(logo[origem + 2] * alpha + fundo[destino + 2] * (1 - alpha))
      fundo[destino + 3] = 255
    }
  }

  return codificarPng(tamanho, tamanho, fundo)
}

mkdirSync(destinoIcones, { recursive: true })
mkdirSync(destinoAssets, { recursive: true })

// Os icones avulsos do pacote estao nomeados pelo fundo a que se destinam:
// "logo-branca-icon" traz a marca colorida (fundo branco) e
// "logo-colorida-icon" traz a marca branca (fundo colorido).
const colorido = decodificarPng(resolve(origemLogos, 'logo-branca-icon.png'))
const branco = decodificarPng(resolve(origemLogos, 'logo-colorida-icon.png'))
const areaColorida = encontrarSimbolo(colorido)
const areaBranca = encontrarSimbolo(branco)

writeFileSync(
  resolve(destinoAssets, 'logo-icone-colorido.png'),
  codificarPng(256, 256, redimensionar(colorido, areaColorida, 256)),
)
writeFileSync(
  resolve(destinoAssets, 'logo-icone-branco.png'),
  codificarPng(256, 256, redimensionar(branco, areaBranca, 256)),
)

const saidas = [
  { arquivo: 'icon-192.png', tamanho: 192, escala: 0.84 },
  { arquivo: 'icon-512.png', tamanho: 512, escala: 0.84 },
  { arquivo: 'maskable-512.png', tamanho: 512, escala: 0.64 },
  { arquivo: 'apple-touch-icon-180.png', tamanho: 180, escala: 0.84 },
  { arquivo: 'favicon-32.png', tamanho: 32, escala: 0.95 },
]

for (const { arquivo, tamanho, escala } of saidas) {
  const png = criarIcone(branco, areaBranca, tamanho, escala)
  writeFileSync(resolve(destinoIcones, arquivo), png)
  console.log(`gerado public/icons/${arquivo} (${tamanho}x${tamanho}, ${png.length} bytes)`)
}

console.log('gerado src/assets/logo-icone-colorido.png e logo-icone-branco.png')
console.log(`area do simbolo: ${areaColorida.lado}x${areaColorida.lado} em ${colorido.largura}x${colorido.altura}`)
