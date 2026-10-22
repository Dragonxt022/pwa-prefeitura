/**
 * Gera os icones PNG do manifest e o apple-touch-icon sem dependencias externas.
 * Uso: npm run icons
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destino = resolve(raiz, 'public/icons')

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

const misturar = (a, b, t) => a + (b - a) * t
const dentroDoRetangulo = (x, y, x1, y1, x2, y2) => x >= x1 && x <= x2 && y >= y1 && y <= y2

function dentroDoTriangulo(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
  const temNeg = d1 < 0 || d2 < 0 || d3 < 0
  const temPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(temNeg && temPos)
}

/** Predio estilizado em coordenadas 0..1 (espaco do glifo). */
function glifo(x, y) {
  if (dentroDoTriangulo(x, y, 0.06, 0.42, 0.5, 0.16, 0.94, 0.42)) return 'branco'
  if (dentroDoRetangulo(x, y, 0.2, 0.46, 0.8, 0.9)) {
    const janelas =
      dentroDoRetangulo(x, y, 0.29, 0.55, 0.39, 0.65) ||
      dentroDoRetangulo(x, y, 0.61, 0.55, 0.71, 0.65) ||
      dentroDoRetangulo(x, y, 0.45, 0.55, 0.55, 0.65)
    const porta = dentroDoRetangulo(x, y, 0.42, 0.74, 0.58, 0.9)
    if (janelas || porta) return 'fundo'
    return 'branco'
  }
  return null
}

function desenhar(tamanho, escalaGlifo, arredondado) {
  const rgba = Buffer.alloc(tamanho * tamanho * 4)
  const amostras = 3
  const raio = 0.2
  const topo = [0x1d, 0x6f, 0xe0]
  const base = [0x0c, 0x3a, 0x7e]
  const branco = [0xff, 0xff, 0xff]

  for (let y = 0; y < tamanho; y += 1) {
    for (let x = 0; x < tamanho; x += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0

      for (let sy = 0; sy < amostras; sy += 1) {
        for (let sx = 0; sx < amostras; sx += 1) {
          const u = (x + (sx + 0.5) / amostras) / tamanho
          const v = (y + (sy + 0.5) / amostras) / tamanho

          const deslocamento = 0.5 - raio
          const dx = Math.max(Math.abs(u - 0.5) - deslocamento, 0)
          const dy = Math.max(Math.abs(v - 0.5) - deslocamento, 0)
          const foraDoCanto = arredondado && Math.hypot(dx, dy) > raio

          if (foraDoCanto) continue

          const gradiente = Math.min(Math.max(v, 0), 1)
          let cor = [
            misturar(topo[0], base[0], gradiente),
            misturar(topo[1], base[1], gradiente),
            misturar(topo[2], base[2], gradiente),
          ]

          const gx = 0.5 + (u - 0.5) / escalaGlifo
          const gy = 0.5 + (v - 0.5) / escalaGlifo
          const parte = glifo(gx, gy)
          if (parte === 'branco') cor = branco
          if (parte === 'fundo') cor = base

          r += cor[0]
          g += cor[1]
          b += cor[2]
          a += 255
        }
      }

      const total = amostras * amostras
      const offset = (y * tamanho + x) * 4
      if (a === 0) continue
      rgba[offset] = Math.round(r / (a / 255))
      rgba[offset + 1] = Math.round(g / (a / 255))
      rgba[offset + 2] = Math.round(b / (a / 255))
      rgba[offset + 3] = Math.round(a / total)
    }
  }

  return codificarPng(tamanho, tamanho, rgba)
}

const saidas = [
  { arquivo: 'icon-192.png', tamanho: 192, escala: 0.62, arredondado: true },
  { arquivo: 'icon-512.png', tamanho: 512, escala: 0.62, arredondado: true },
  { arquivo: 'maskable-512.png', tamanho: 512, escala: 0.46, arredondado: false },
  { arquivo: 'apple-touch-icon-180.png', tamanho: 180, escala: 0.62, arredondado: false },
]

mkdirSync(destino, { recursive: true })

for (const { arquivo, tamanho, escala, arredondado } of saidas) {
  const png = desenhar(tamanho, escala, arredondado)
  writeFileSync(resolve(destino, arquivo), png)
  console.log(`gerado public/icons/${arquivo} (${tamanho}x${tamanho}, ${png.length} bytes)`)
}
