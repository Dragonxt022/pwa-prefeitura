import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after } from 'node:test'

const diretorio = mkdtempSync(join(tmpdir(), 'prefeitura-avisos-'))
process.env.DATA_FILE = join(diretorio, 'estado.json')
process.env.MOCK_LATENCY_MS = '0'

const { criarApp } = await import('../src/app.js')

const app = criarApp({ latenciaMs: 0 })
const servidor = await new Promise((resolver) => {
  const instancia = app.listen(0, '127.0.0.1', () => resolver(instancia))
})
const base = `http://127.0.0.1:${servidor.address().port}/api`

after(async () => {
  servidor.closeAllConnections?.()
  await new Promise((resolver) => servidor.close(resolver))
  rmSync(diretorio, { recursive: true, force: true })
})

async function chamar(caminho, { metodo = 'GET', corpo, cookie } = {}) {
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const payload = await resposta.json().catch(() => null)
  const cookies = resposta.headers.getSetCookie?.() ??
    [resposta.headers.get('set-cookie')].filter(Boolean)
  return { status: resposta.status, payload, cookies }
}

function cookieDaResposta(resposta) {
  return resposta.cookies.map((item) => item.split(';')[0]).join('; ')
}

async function entrarComo(email) {
  const resposta = await chamar('/gestao/login', {
    metodo: 'POST',
    corpo: { email, senha: process.env.DEMO_PASSWORD || 'prefeitura-demo' },
  })
  assert.equal(resposta.status, 200)
  return cookieDaResposta(resposta)
}

const NOVO_AVISO = {
  titulo: 'Feira de serviços neste sábado',
  resumo: 'Atendimento gratuito das 8h às 13h na praça central.',
  categoria: 'Serviço',
  prioridade: 'alta',
}

test('aviso criado pelo admin aparece na home e pode ser desativado', async () => {
  const antes = await chamar('/avisos')
  assert.equal(antes.status, 200)
  const totalInicial = antes.payload.dados.length
  assert.ok(totalInicial >= 4)
  assert.equal(antes.payload.dados[0].ativo, undefined)

  const semSessao = await chamar('/gestao/avisos', { metodo: 'POST', corpo: NOVO_AVISO })
  assert.equal(semSessao.status, 401)

  const cookieAdmin = await entrarComo('admin@prefeitura.demo')

  const criado = await chamar('/gestao/avisos', {
    metodo: 'POST',
    corpo: NOVO_AVISO,
    cookie: cookieAdmin,
  })
  assert.equal(criado.status, 201)
  const id = criado.payload.dados.id
  assert.equal(criado.payload.dados.ativo, true)

  const depois = await chamar('/avisos')
  assert.equal(depois.payload.dados.length, totalInicial + 1)
  assert.equal(depois.payload.dados[0].id, id)

  const desativado = await chamar(`/gestao/avisos/${id}`, {
    metodo: 'PATCH',
    corpo: { ativo: false },
    cookie: cookieAdmin,
  })
  assert.equal(desativado.status, 200)
  assert.equal(desativado.payload.dados.ativo, false)

  const final = await chamar('/avisos')
  assert.equal(final.payload.dados.length, totalInicial)
  assert.equal(final.payload.dados.some((aviso) => aviso.id === id), false)
})

test('somente administradores podem criar avisos', async () => {
  const cookieSetor = await entrarComo('triagem@prefeitura.demo')
  const resposta = await chamar('/gestao/avisos', {
    metodo: 'POST',
    corpo: { ...NOVO_AVISO, titulo: 'Tentativa sem permissão' },
    cookie: cookieSetor,
  })
  assert.equal(resposta.status, 403)
})

test('painel lista avisos e auditoria', async () => {
  const cookieAdmin = await entrarComo('admin@prefeitura.demo')
  const resposta = await chamar('/gestao/avisos', { cookie: cookieAdmin })
  assert.equal(resposta.status, 200)
  assert.ok(Array.isArray(resposta.payload.dados.avisos))
  assert.ok(resposta.payload.dados.avisos.length >= 4)
  assert.ok(Array.isArray(resposta.payload.dados.auditoria))
  assert.ok(['mysql', 'memoria'].includes(resposta.payload.dados.persistencia))
})
