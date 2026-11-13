import { Router } from 'express'
import {
  atualizarAdmin,
  criarAdmin,
  listar,
} from '../../controladores/gestao/avisos.js'
import { exigirAdmin } from '../../middlewares/autenticacao.js'

const router = Router()

// Leitura liberada para qualquer sessão autenticada; escrita só para admin.
router.get('/', listar)

router.post('/', exigirAdmin, criarAdmin)
router.patch('/:id', exigirAdmin, atualizarAdmin)

export default router
