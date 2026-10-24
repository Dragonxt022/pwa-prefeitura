import { Router } from 'express'
import {
  atualizar,
  criar,
  listar,
} from '../../controladores/gestao/usuarios.js'
import { exigirAdmin } from '../../middlewares/autenticacao.js'

const router = Router()

router.use(exigirAdmin)

router.get('/', listar)
router.post('/', criar)
router.patch('/:id', atualizar)

export default router
