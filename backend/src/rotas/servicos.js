import { Router } from 'express'
import { listarServicos } from '../controladores/catalogo.js'

const router = Router()

router.get('/', listarServicos)

export default router
