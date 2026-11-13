import { Router } from 'express'
import { criarRateLimit } from '../middlewares/rate-limit.js'
import { estadoFilaTriagem } from '../servicos/triagem.js'

const router = Router()

// Consulta pública e leve: permite avisar o cidadão antes de enviar o pedido.
router.get(
  '/fila',
  criarRateLimit({ janelaMs: 60_000, maximo: 120 }),
  (_req, res) => {
    res.set('Cache-Control', 'no-store')
    res.json({ dados: estadoFilaTriagem() })
  },
)

export default router
