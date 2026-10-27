import { Router } from 'express'
import {
  avaliar,
  criar,
  detalhar,
  listarSemelhantes,
  obterStatus,
} from '../controladores/solicitacoes.js'
import { criarRateLimit } from '../middlewares/rate-limit.js'

const router = Router()

router.get(
  '/semelhantes',
  criarRateLimit({ janelaMs: 60_000, maximo: 30 }),
  listarSemelhantes,
)
router.post('/', criarRateLimit({ janelaMs: 60_000, maximo: 10 }), criar)
router.post(
  '/:protocolo/avaliacao',
  criarRateLimit({ janelaMs: 60_000, maximo: 10 }),
  avaliar,
)
router.get(
  '/:protocolo',
  criarRateLimit({ janelaMs: 60_000, maximo: 30 }),
  detalhar,
)
router.get(
  '/:protocolo/status',
  criarRateLimit({ janelaMs: 60_000, maximo: 60 }),
  obterStatus,
)

export default router
