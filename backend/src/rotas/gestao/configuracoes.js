import { Router } from 'express'
import {
  obter,
  salvarSecao,
  testarEmail,
  testarIA,
} from '../../controladores/gestao/configuracoes.js'
import { exigirAdmin } from '../../middlewares/autenticacao.js'

const router = Router()

router.use(exigirAdmin)

router.get('/', obter)
router.put('/:secao', salvarSecao)
router.post('/email/teste', testarEmail)
router.post('/ia/teste', testarIA)

export default router
