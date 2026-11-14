import { Router } from 'express'
import { listarAvisos, obterAviso } from '../controladores/catalogo.js'

const router = Router()

router.get('/', listarAvisos)
router.get('/:id', obterAviso)

export default router
