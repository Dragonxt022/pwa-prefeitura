import { Router } from 'express'
import { exigirAdmin } from '../../middlewares/autenticacao.js'
import { criarRateLimit } from '../../middlewares/rate-limit.js'
import { gerarRecuperacao } from '../../controladores/gestao/cidadaos.js'

const router = Router()

router.use(exigirAdmin)

router.post(
  '/recuperacao',
  criarRateLimit({ janelaMs: 60_000, maximo: 20 }),
  gerarRecuperacao,
)

export default router
