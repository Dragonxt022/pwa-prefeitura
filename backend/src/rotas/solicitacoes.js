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

router.get('/semelhantes', listarSemelhantes)
router.post('/', criarRateLimit({ janelaMs: 60_000, maximo: 10 }), criar)
router.post('/:protocolo/avaliacao', avaliar)
router.get('/:protocolo', detalhar)
router.get('/:protocolo/status', obterStatus)

export default router
