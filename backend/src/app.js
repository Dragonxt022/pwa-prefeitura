import cors from 'cors'
import express from 'express'
import { AppError, naoEncontrado } from './errors.js'
import avisosRouter from './routes/avisos.js'
import perfilRouter from './routes/perfil.js'
import servicosRouter from './routes/servicos.js'
import solicitacoesRouter from './routes/solicitacoes.js'

const ORIGENS_PADRAO = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

function origensPermitidas() {
  const configuradas = process.env.CORS_ORIGINS
  if (!configuradas) return ORIGENS_PADRAO
  return configuradas.split(',').map((origem) => origem.trim()).filter(Boolean)
}

export function criarApp({ latenciaMs = Number(process.env.MOCK_LATENCY_MS ?? 200) } = {}) {
  const app = express()

  app.disable('x-powered-by')
  app.set('json spaces', 2)
  app.use(cors({ origin: origensPermitidas() }))
  app.use(express.json({ limit: '16kb' }))

  if (latenciaMs > 0) {
    app.use('/api', (_req, _res, next) => {
      setTimeout(next, latenciaMs)
    })
  }

  app.get('/api/health', (_req, res) => {
    res.json({
      dados: {
        status: 'ok',
        versao: '0.1.0',
        horario: new Date().toISOString(),
        latenciaSimuladaMs: latenciaMs,
      },
    })
  })

  app.use('/api/servicos', servicosRouter)
  app.use('/api/avisos', avisosRouter)
  app.use('/api/perfil', perfilRouter)
  app.use('/api/solicitacoes', solicitacoesRouter)

  app.use('/api', (req) => {
    throw naoEncontrado(`Rota de API inexistente: ${req.method} ${req.originalUrl}`)
  })

  app.use((erro, req, res, _next) => {
    if (erro instanceof AppError) {
      return res.status(erro.status).json({
        erro: { codigo: erro.codigo, mensagem: erro.mensagem, campos: erro.campos },
      })
    }

    if (erro?.type === 'entity.parse.failed') {
      return res.status(400).json({
        erro: { codigo: 'json_invalido', mensagem: 'O corpo da requisição não é um JSON válido.' },
      })
    }

    if (erro?.type === 'entity.too.large') {
      return res.status(413).json({
        erro: { codigo: 'corpo_muito_grande', mensagem: 'O conteúdo enviado excede o limite de 16 KB.' },
      })
    }

    console.error('[erro não tratado]', erro)
    return res.status(500).json({
      erro: { codigo: 'erro_interno', mensagem: 'Erro inesperado no servidor de simulação.' },
    })
  })

  return app
}
