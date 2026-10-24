import { Router } from 'express'
import { obterPerfil } from '../controladores/catalogo.js'

const router = Router()

router.get('/', obterPerfil)

export default router
