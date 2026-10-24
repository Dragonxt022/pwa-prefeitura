import cors from 'cors'
import express from 'express'
import { apiNaoEncontrada, tratarErro } from './middlewares/erros.js'
import avisosRouter from './rotas/avisos.js'
import configuracoesRouter from './rotas/configuracoes.js'
import gestaoRouter from './rotas/gestao.js'
import perfilRouter from './rotas/perfil.js'
import servicosRouter from './rotas/servicos.js'
import solicitacoesRouter from './rotas/solicitacoes.js'

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
  // Credenciais são necessárias para o cookie HttpOnly da sessão de gestão.
  app.use(cors({ origin: origensPermitidas(), credentials: true }))
  // Fotos são reenquadradas no cliente, mas ainda podem chegar com alguns
  // centenas de KB em base64. O limite maior vale apenas para este piloto.
  app.use(express.json({ limit: '2mb' }))

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
  app.use('/api/configuracoes', configuracoesRouter)
  app.use('/api/perfil', perfilRouter)
  app.use('/api/solicitacoes', solicitacoesRouter)
  app.use('/api/gestao', gestaoRouter)

  app.use('/api', apiNaoEncontrada)

  app.use(tratarErro)

  return app
}
