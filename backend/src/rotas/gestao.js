import { Router } from 'express'
import {
  listarSetores,
  login,
  logout,
  obterSessao,
} from '../controladores/gestao/autenticacao.js'
import { listarSecretarias } from '../controladores/gestao/catalogo.js'
import { exigirSessao } from '../middlewares/autenticacao.js'
import { criarRateLimit } from '../middlewares/rate-limit.js'
import catalogoRouter from './gestao/catalogo.js'
import configuracoesRouter from './gestao/configuracoes.js'
import solicitacoesRouter from './gestao/solicitacoes.js'
import usuariosRouter from './gestao/usuarios.js'

const router = Router()

router.post('/login', criarRateLimit({ janelaMs: 60_000, maximo: 20 }), login)
router.post('/logout', logout)

router.use(exigirSessao)

router.get('/sessao', obterSessao)
router.get('/setores', listarSetores)
router.get('/secretarias', listarSecretarias)

router.use('/catalogo', catalogoRouter)
router.use('/configuracoes', configuracoesRouter)
router.use('/usuarios', usuariosRouter)
router.use('/solicitacoes', solicitacoesRouter)

export default router
