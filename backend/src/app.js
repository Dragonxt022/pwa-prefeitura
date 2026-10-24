import cors from 'cors'
import express from 'express'
import {
  AppError,
  CODIGOS_ERRO,
  corpoErro,
  naoEncontrado,
  statusDoErro,
} from './errors.js'
import avisosRouter from './routes/avisos.js'
import configuracoesRouter from './routes/configuracoes.js'
import gestaoRouter from './routes/gestao.js'
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

  app.use('/api', (req) => {
    throw naoEncontrado(`Rota de API inexistente: ${req.method} ${req.originalUrl}`)
  })

  app.use((erro, req, res, _next) => {
    if (erro instanceof AppError) {
      return res
        .status(erro.status)
        .json(corpoErro(erro.codigo, { mensagem: erro.mensagem, campos: erro.campos }))
    }

    if (erro?.type === 'entity.parse.failed') {
      return res
        .status(statusDoErro(CODIGOS_ERRO.JSON_INVALIDO))
        .json(corpoErro(CODIGOS_ERRO.JSON_INVALIDO))
    }

    if (erro?.type === 'entity.too.large') {
      return res
        .status(statusDoErro(CODIGOS_ERRO.CORPO_MUITO_GRANDE))
        .json(
          corpoErro(CODIGOS_ERRO.CORPO_MUITO_GRANDE, {
            mensagem: 'O conteúdo enviado excede o limite de 2 MB.',
          }),
        )
    }

    console.error('[erro não tratado]', erro)
    return res
      .status(statusDoErro(CODIGOS_ERRO.ERRO_INTERNO))
      .json(
        corpoErro(CODIGOS_ERRO.ERRO_INTERNO, {
          mensagem: 'Erro inesperado no servidor de simulação.',
        }),
      )
  })

  return app
}
