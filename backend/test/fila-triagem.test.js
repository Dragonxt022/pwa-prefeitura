import assert from 'node:assert/strict'
import test from 'node:test'
import { criarFilaProcessamento } from '../src/servicos/fila-triagem.js'

function proximoTick() {
  return new Promise((resolver) => setImmediate(resolver))
}

test('fila respeita concorrência, aviso e limite máximo', async () => {
  const pendentes = []
  const fila = criarFilaProcessamento({
    concorrencia: 1,
    limiteAviso: 2,
    maximo: 2,
    executor: (item) =>
      new Promise((resolver) => {
        pendentes.push({ item, resolver })
      }),
  })

  const a = fila.adicionar('a', { chave: 'a' })
  assert.equal(a.aceito, true)
  assert.equal(a.aviso, false)

  await proximoTick()
  assert.deepEqual(pendentes.map((item) => item.item), ['a'])
  assert.equal(fila.estado().processando, 1)

  const duplicado = fila.adicionar('a', { chave: 'a' })
  assert.equal(duplicado.aceito, false)
  assert.equal(duplicado.duplicado, true)

  const b = fila.adicionar('b', { chave: 'b' })
  assert.equal(b.aceito, true)
  assert.equal(b.aviso, true)
  assert.equal(fila.estado().pendentes, 1)

  const c = fila.adicionar('c', { chave: 'c' })
  assert.equal(c.aceito, true)
  assert.equal(fila.estado().pendentes, 2)

  const d = fila.adicionar('d', { chave: 'd' })
  assert.equal(d.aceito, false)
  assert.equal(d.motivo, 'fila_cheia')

  pendentes.find((item) => item.item === 'a').resolver()
  await proximoTick()
  await proximoTick()
  assert.deepEqual(pendentes.map((item) => item.item), ['a', 'b'])
  assert.equal(fila.estado().pendentes, 1)

  pendentes.find((item) => item.item === 'b').resolver()
  await proximoTick()
  await proximoTick()
  assert.deepEqual(pendentes.map((item) => item.item), ['a', 'b', 'c'])

  pendentes.find((item) => item.item === 'c').resolver()
  await proximoTick()
  await proximoTick()
  assert.equal(fila.estado().processando, 0)
  assert.equal(fila.estado().pendentes, 0)
  assert.equal(fila.estado().aviso, false)
})

test('falha em um item não interrompe a fila', async () => {
  const processados = []
  const fila = criarFilaProcessamento({
    concorrencia: 1,
    limiteAviso: 10,
    maximo: 10,
    executor: async (item) => {
      processados.push(item)
      if (item === 'erro') throw new Error('falha simulada')
    },
  })

  const original = console.error
  console.error = () => {}
  try {
    fila.adicionar('erro')
    fila.adicionar('ok')
    await proximoTick()
    await proximoTick()
    await proximoTick()
  } finally {
    console.error = original
  }

  assert.deepEqual(processados, ['erro', 'ok'])
  assert.equal(fila.estado().processando, 0)
})
