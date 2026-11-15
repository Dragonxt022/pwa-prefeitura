import { Router } from 'express'
import {
  atualizarStatus,
  detalhar,
  listar,
  moderarFoto,
  transferir,
} from '../../controladores/gestao/solicitacoes.js'

const router = Router()

router.get('/', listar)
router.get('/:protocolo', detalhar)
router.patch('/:protocolo/status', atualizarStatus)
router.patch('/:protocolo/foto-moderacao', moderarFoto)
router.patch('/:protocolo/transferir', transferir)

export default router
