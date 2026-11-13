import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after } from 'node:test'
import { gerarCodigoAcesso } from '../../shared/codigo-acesso.js'

const diretorio = mkdtempSync(join(tmpdir(), 'prefeitura-pedidos-conta-'))
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

async function cadastrar(email) {
  const resposta = await chamar('/cidadao/cadastro', {
    metodo: 'POST',
    corpo: {
      nome: 'Cidadão de Teste',
      email,
      senha: 'SenhaForte123',
      telefone: '69999990000',
      cep: '76800000',
      logradouro: 'Rua de Teste',
      numero: '10',
      bairro: 'Centro',
      cidade: 'Cujubim',
      uf: 'RO',
      consentimento: true,
    },
  })
  assert.equal(resposta.status, 201)
  return { cookie: cookieDaResposta(resposta), cidadao: resposta.payload.dados.cidadao }
}

async function criarPedido({ cookie, tipo = 'iluminacao', endereco = 'Rua de Teste, 10' }) {
  const codigoAcesso = gerarCodigoAcesso()
  const resposta = await chamar('/solicitacoes', {
    metodo: 'POST',
    cookie,
    corpo: {
      tipo,
      descricao: 'Descrição de teste com detalhes suficientes para o atendimento.',
      endereco,
      contato: '',
      clientId: randomUUID(),
      codigoAcesso,
    },
  })
  assert.equal(resposta.status, 201)
  return {
    protocolo: resposta.payload.dados.protocolo,
    codigoAcesso,
    dados: resposta.payload.dados,
  }
}

test('conta lista, detalha, vincula e avalia os próprios pedidos', async (t) => {
  const contaA = await cadastrar('conta.a@example.invalid')
  const contaB = await cadastrar('conta.b@example.invalid')

  let pedidoA
  await t.test('pedido criado logado entra na conta e não expõe vínculo interno', async () => {
    pedidoA = await criarPedido({ cookie: contaA.cookie })
    assert.equal(pedidoA.dados.cidadaoId, undefined)

    const lista = await chamar('/cidadao/solicitacoes', { cookie: contaA.cookie })
    assert.equal(lista.status, 200)
    assert.equal(lista.payload.total, 1)
    assert.equal(lista.payload.dados[0].protocolo, pedidoA.protocolo)
    assert.equal(lista.payload.dados[0].cidadaoId, undefined)

    const detalhe = await chamar(`/cidadao/solicitacoes/${pedidoA.protocolo}`, {
      cookie: contaA.cookie,
    })
    assert.equal(detalhe.status, 200)
    assert.equal(detalhe.payload.dados.protocolo, pedidoA.protocolo)
    assert.equal(detalhe.payload.dados.contato, undefined)
    assert.equal(detalhe.payload.dados.cidadaoId, undefined)
  })

  await t.test('outra conta não acessa o pedido', async () => {
    const detalhe = await chamar(`/cidadao/solicitacoes/${pedidoA.protocolo}`, {
      cookie: contaB.cookie,
    })
    assert.equal(detalhe.status, 404)

    const lista = await chamar('/cidadao/solicitacoes', { cookie: contaB.cookie })
    assert.equal(lista.payload.total, 0)
  })

  await t.test('vínculo exige o código correto e traz pedido antigo', async () => {
    const antigo = await criarPedido({
      cookie: '',
      tipo: 'limpeza',
      endereco: 'Rua Antiga, 50',
    })

    const errado = await chamar('/cidadao/solicitacoes/vincular', {
      metodo: 'POST',
      cookie: contaA.cookie,
      corpo: { protocolo: antigo.protocolo, codigoAcesso: gerarCodigoAcesso() },
    })
    assert.equal(errado.status, 404)

    const vinculado = await chamar('/cidadao/solicitacoes/vincular', {
      metodo: 'POST',
      cookie: contaA.cookie,
      corpo: { protocolo: antigo.protocolo, codigoAcesso: antigo.codigoAcesso },
    })
    assert.equal(vinculado.status, 200)
    assert.equal(vinculado.payload.dados.protocolo, antigo.protocolo)

    const lista = await chamar('/cidadao/solicitacoes', { cookie: contaA.cookie })
    assert.equal(lista.payload.total, 2)
    assert.ok(
      lista.payload.dados.some((item) => item.protocolo === antigo.protocolo),
    )

    const outraConta = await chamar('/cidadao/solicitacoes/vincular', {
      metodo: 'POST',
      cookie: contaB.cookie,
      corpo: { protocolo: antigo.protocolo, codigoAcesso: antigo.codigoAcesso },
    })
    assert.equal(outraConta.status, 404)
  })

  await t.test('avaliação pela conta exige conclusão e é única', async () => {
    const admin = await chamar('/gestao/login', {
      metodo: 'POST',
      corpo: { email: 'admin@prefeitura.demo', senha: 'prefeitura-demo' },
    })
    assert.equal(admin.status, 200)
    const cookieAdmin = cookieDaResposta(admin)

    const antes = await chamar(`/cidadao/solicitacoes/${pedidoA.protocolo}/avaliacao`, {
      metodo: 'POST',
      cookie: contaA.cookie,
      corpo: { nota: 5 },
    })
    assert.equal(antes.status, 422)

    const status = await chamar(`/gestao/solicitacoes/${pedidoA.protocolo}/status`, {
      metodo: 'PATCH',
      cookie: cookieAdmin,
      corpo: { status: 'concluida' },
    })
    assert.equal(status.status, 200)

    const avaliacao = await chamar(`/cidadao/solicitacoes/${pedidoA.protocolo}/avaliacao`, {
      metodo: 'POST',
      cookie: contaA.cookie,
      corpo: { nota: 5, comentario: 'Atendimento rápido.' },
    })
    assert.equal(avaliacao.status, 201)
    assert.equal(avaliacao.payload.dados.avaliacao.nota, 5)

    const repetida = await chamar(`/cidadao/solicitacoes/${pedidoA.protocolo}/avaliacao`, {
      metodo: 'POST',
      cookie: contaA.cookie,
      corpo: { nota: 4 },
    })
    assert.equal(repetida.status, 409)

    const outra = await chamar(`/cidadao/solicitacoes/${pedidoA.protocolo}/avaliacao`, {
      metodo: 'POST',
      cookie: contaB.cookie,
      corpo: { nota: 5 },
    })
    assert.equal(outra.status, 404)
  })
})
