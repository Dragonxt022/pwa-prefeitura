import { Router } from 'express'
import { obterConfiguracoesPublicas } from '../controladores/configuracoes.js'

const router = Router()

router.get('/', obterConfiguracoesPublicas)

export default router
