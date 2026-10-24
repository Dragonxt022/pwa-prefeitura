import { Router } from 'express'
import { listarAvisos } from '../controladores/catalogo.js'

const router = Router()

router.get('/', listarAvisos)

export default router
