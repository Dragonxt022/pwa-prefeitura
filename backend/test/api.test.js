import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after } from 'node:test'
import {
  CODIGO_ACESSO_ALFABETO,
  gerarCodigoAcesso,
} from '../../shared/codigo-acesso.js'

const diretorio = mkdtempSync(join(tmpdir(), 'prefeitura-api-'))
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

async function chamar(caminho, { metodo = 'GET', corpo, codigoAcesso } = {}) {
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(codigoAcesso ? { 'x-codigo-acesso': codigoAcesso } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const payload = await resposta.json().catch(() => null)
  return { status: resposta.status, payload }
}

function payloadSolicitacao(codigoAcesso, sobrescritas = {}) {
  return {
    tipo: 'iluminacao',
    descricao: 'Lâmpada apagada em frente ao número 987, precisa de reparo.',
    endereco: 'Rua do Contrato, 987 - Bairro Teste',
    contato: '',
    foto: null,
    localizacao: null,
    clientId: randomUUID(),
    codigoAcesso,
    ...sobrescritas,
  }
}

test('contrato público exige código de acesso e não expõe segredos', async (t) => {
  await t.test('a criação rejeita código ausente ou inválido', async () => {
    const semCodigo = payloadSolicitacao('')
    delete semCodigo.codigoAcesso
    const ausente = await chamar('/solicitacoes', { metodo: 'POST', corpo: semCodigo })
    assert.equal(ausente.status, 422)
    assert.ok(ausente.payload.erro.campos.codigoAcesso)

    const invalido = await chamar('/solicitacoes', {
      metodo: 'POST',
      corpo: payloadSolicitacao('CODIGO-INVALIDO'),
    })
    assert.equal(invalido.status, 422)
    assert.ok(invalido.payload.erro.campos.codigoAcesso)
  })

  const codigo = gerarCodigoAcesso()
  assert.match(codigo, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  for (const caractere of codigo.replaceAll('-', '')) {
    assert.ok(CODIGO_ACESSO_ALFABETO.includes(caractere))
  }

  const criacao = payloadSolicitacao(codigo.toLowerCase().replaceAll('-', ''))
  let protocolo = null

  await t.test('cria o pedido e omite hash, contato e identificador idempotente', async () => {
    const resposta = await chamar('/solicitacoes', { metodo: 'POST', corpo: criacao })
    assert.equal(resposta.status, 201)
    assert.equal(resposta.payload.criada, true)
    assert.ok(resposta.payload.dados.protocolo)
    assert.equal(resposta.payload.dados.codigoAcessoHash, undefined)
    assert.equal(resposta.payload.dados.clientId, undefined)
    assert.equal(resposta.payload.dados.contato, undefined)
    assert.equal(resposta.payload.dados.triagem, undefined)
    assert.equal(resposta.payload.dados.transferencias, undefined)
    assert.ok(!JSON.stringify(resposta.payload).includes(codigo))
    protocolo = resposta.payload.dados.protocolo
  })

  await t.test('detalhe, status e avaliação sem código usam o mesmo erro genérico', async () => {
    for (const caminho of [
      `/solicitacoes/${protocolo}`,
      `/solicitacoes/${protocolo}/status`,
    ]) {
      const resposta = await chamar(caminho)
      assert.equal(resposta.status, 404)
      assert.equal(resposta.payload.erro.codigo, 'codigo_acesso_invalido')
      assert.equal(resposta.payload.dados, undefined)
    }

    const avaliacao = await chamar(`/solicitacoes/${protocolo}/avaliacao`, {
      metodo: 'POST',
      corpo: { nota: 5, comentario: '' },
    })
    assert.equal(avaliacao.status, 404)
    assert.equal(avaliacao.payload.erro.codigo, 'codigo_acesso_invalido')
    assert.equal(avaliacao.payload.dados, undefined)

    const inexistente = await chamar('/solicitacoes/PREF-2026-999999', {
      codigoAcesso: codigo,
    })
    assert.equal(inexistente.status, 404)
    assert.equal(inexistente.payload.erro.codigo, 'codigo_acesso_invalido')
  })

  await t.test('código errado também não revela o pedido', async () => {
    const errado = gerarCodigoAcesso()
    const resposta = await chamar(`/solicitacoes/${protocolo}`, { codigoAcesso: errado })
    assert.equal(resposta.status, 404)
    assert.equal(resposta.payload.erro.codigo, 'codigo_acesso_invalido')
    assert.equal(resposta.payload.dados, undefined)
  })

  await t.test('código correto libera detalhe e status sem campos internos', async () => {
    const detalhe = await chamar(`/solicitacoes/${protocolo}`, { codigoAcesso: codigo })
    assert.equal(detalhe.status, 200)
    assert.equal(detalhe.payload.dados.protocolo, protocolo)
    assert.equal(detalhe.payload.dados.endereco, criacao.endereco)
    assert.equal(detalhe.payload.dados.codigoAcessoHash, undefined)
    assert.equal(detalhe.payload.dados.clientId, undefined)
    assert.equal(detalhe.payload.dados.contato, undefined)

    const status = await chamar(`/solicitacoes/${protocolo}/status`, { codigoAcesso: codigo })
    assert.equal(status.status, 200)
    assert.equal(status.payload.dados.protocolo, protocolo)
    assert.equal(status.payload.dados.status, 'recebida')
    assert.equal(status.payload.dados.endereco, undefined)
    assert.equal(status.payload.dados.descricao, undefined)
  })

  await t.test('avaliação exige código antes de validar o status', async () => {
    const resposta = await chamar(`/solicitacoes/${protocolo}/avaliacao`, {
      metodo: 'POST',
      corpo: { nota: 5, comentario: 'Ótimo' },
      codigoAcesso: codigo,
    })
    assert.equal(resposta.status, 422)
    assert.ok(resposta.payload.erro.campos.avaliacao)
  })

  await t.test('reenvio idempotente exige o mesmo código', async () => {
    const repetida = await chamar('/solicitacoes', { metodo: 'POST', corpo: criacao })
    assert.equal(repetida.status, 200)
    assert.equal(repetida.payload.criada, false)
    assert.equal(repetida.payload.dados.protocolo, protocolo)

    const outroCodigo = gerarCodigoAcesso()
    const conflito = await chamar('/solicitacoes', {
      metodo: 'POST',
      corpo: { ...criacao, codigoAcesso: outroCodigo },
    })
    assert.equal(conflito.status, 404)
    assert.equal(conflito.payload.erro.codigo, 'codigo_acesso_invalido')
    assert.equal(conflito.payload.dados, undefined)
  })

  await t.test('semelhantes não devolve protocolo nem dados do pedido', async () => {
    const codigoSemelhante = gerarCodigoAcesso()
    const semelhante = await chamar('/solicitacoes', {
      metodo: 'POST',
      corpo: payloadSolicitacao(codigoSemelhante, {
        endereco: 'Avenida do Contrato Semelhante, 44 - Bairro Teste',
        descricao: 'Entulho deixado na calçada em frente ao número 44.',
        tipo: 'limpeza',
      }),
    })
    assert.equal(semelhante.status, 201)

    const consulta = await chamar(
      '/solicitacoes/semelhantes?tipo=limpeza&endereco=' +
        encodeURIComponent('Avenida do Contrato Semelhante, 44 - Bairro Teste'),
    )
    assert.equal(consulta.status, 200)
    assert.ok(consulta.payload.dados.length >= 1)
    for (const item of consulta.payload.dados) {
      assert.equal(item.protocolo, undefined)
      assert.equal(item.endereco, undefined)
      assert.equal(item.descricao, undefined)
      assert.equal(item.clientId, undefined)
      assert.equal(item.codigoAcessoHash, undefined)
    }
  })

  await t.test('protocolos de demonstração usam o código documentado', async () => {
    const semCodigo = await chamar('/solicitacoes/PREF-2026-000001')
    assert.equal(semCodigo.status, 404)

    const resposta = await chamar('/solicitacoes/PREF-2026-000001', {
      codigoAcesso: 'DEMA-ACES-S226',
    })
    assert.equal(resposta.status, 200)
    assert.equal(resposta.payload.dados.protocolo, 'PREF-2026-000001')
  })
})

test.after(async () => {
  await new Promise((resolver) => servidor.close(resolver))
  rmSync(diretorio, { recursive: true, force: true })
})
