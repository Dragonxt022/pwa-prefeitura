import { Router } from 'express'
import {
  atualizarSecretariaAdmin,
  atualizarServicoAdmin,
  atualizarSetorAdmin,
  criarSecretariaAdmin,
  criarServicoAdmin,
  criarSetorAdmin,
  listar,
} from '../../controladores/gestao/catalogo.js'
import { exigirAdmin } from '../../middlewares/autenticacao.js'

const router = Router()

// Leitura liberada para qualquer sessão autenticada; escrita só para admin.
router.get('/', listar)

router.post('/secretarias', exigirAdmin, criarSecretariaAdmin)
router.patch('/secretarias/:id', exigirAdmin, atualizarSecretariaAdmin)

router.post('/setores', exigirAdmin, criarSetorAdmin)
router.patch('/setores/:id', exigirAdmin, atualizarSetorAdmin)

router.post('/servicos', exigirAdmin, criarServicoAdmin)
router.patch('/servicos/:id', exigirAdmin, atualizarServicoAdmin)

export default router
