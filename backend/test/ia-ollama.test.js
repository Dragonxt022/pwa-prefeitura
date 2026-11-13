import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { listarSetores } from '../src/dominio/catalogo.js'
import {
  AMOSTRA_QUALIDADE,
  classificarComModelo,
  SETOR_ESPERADO_QUALIDADE,
} from '../src/servicos/ia.js'

function servidorFakeOllama(resposta) {
  return new Promise((resolver) => {
    const chamadas = []
    const servidor = createServer((req, res) => {
      let corpo = ''
      req.on('data', (parte) => {
        corpo += parte
      })
      req.on('end', () => {
        chamadas.push({ url: req.url, corpo: JSON.parse(corpo || '{}') })
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(resposta))
      })
    })
    servidor.listen(0, '127.0.0.1', () => {
      resolver({
        servidor,
        chamadas,
        porta: servidor.address().port,
      })
    })
  })
}

test('Ollama usa /api/chat com o modo de pensamento desativado', async () => {
  const { servidor, chamadas, porta } = await servidorFakeOllama({
    message: {
      role: 'assistant',
      content: JSON.stringify({
        setorId: SETOR_ESPERADO_QUALIDADE,
        confianca: 0.91,
        justificativa: 'Poda de árvore com risco sobre a fiação.',
      }),
    },
    done: true,
  })

  try {
    const resultado = await classificarComModelo({
      config: {
        provedor: 'ollama',
        modelo: 'qwen3:1.7b',
        baseUrl: `http://127.0.0.1:${porta}`,
        temperatura: 0.2,
        timeoutMs: 5_000,
        apiKey: '',
      },
      solicitacao: AMOSTRA_QUALIDADE,
      setores: listarSetores(),
    })

    assert.equal(resultado.setorId, SETOR_ESPERADO_QUALIDADE)
    assert.equal(resultado.provedor, 'ollama')
    assert.equal(resultado.modelo, 'qwen3:1.7b')
    assert.equal(chamadas.length, 1)
    assert.equal(chamadas[0].url, '/api/chat')
    assert.equal(chamadas[0].corpo.think, false)
    assert.equal(chamadas[0].corpo.stream, false)
    assert.equal(chamadas[0].corpo.model, 'qwen3:1.7b')
  } finally {
    await new Promise((resolver) => servidor.close(resolver))
  }
})

test('URL antiga do Ollama com /v1 continua funcionando', async () => {
  const { servidor, chamadas, porta } = await servidorFakeOllama({
    message: {
      content: JSON.stringify({
        setorId: SETOR_ESPERADO_QUALIDADE,
        confianca: 0.8,
        justificativa: 'Árvore sobre a fiação.',
      }),
    },
  })

  try {
    await classificarComModelo({
      config: {
        provedor: 'ollama',
        modelo: 'qwen3:1.7b',
        baseUrl: `http://127.0.0.1:${porta}/v1`,
        temperatura: 0.2,
        timeoutMs: 5_000,
        apiKey: '',
      },
      solicitacao: AMOSTRA_QUALIDADE,
      setores: listarSetores(),
    })

    assert.equal(chamadas[0].url, '/api/chat')
  } finally {
    await new Promise((resolver) => servidor.close(resolver))
  }
})
