import { Router } from 'express'
import { criarRateLimit } from '../middlewares/rate-limit.js'
import {
  carregarCidadao,
  exigirCidadao,
} from '../middlewares/autenticacao-cidadao.js'
import {
  atualizar,
  avaliarPedido,
  cadastrar,
  detalharSolicitacao,
  excluir,
  exportarDados,
  listarSolicitacoes,
  login,
  logout,
  perfil,
  redefinirSenha,
  sessao,
  solicitarSenha,
  vincularPedido,
} from '../controladores/cidadao.js'

const router = Router()

// Dados pessoais nunca devem ser cacheados por navegador, proxy ou Service Worker.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.set('Pragma', 'no-cache')
  next()
})

router.post('/cadastro', criarRateLimit({ janelaMs: 60_000, maximo: 5 }), cadastrar)
router.post('/login', criarRateLimit({ janelaMs: 60_000, maximo: 10 }), login)
router.post(
  '/senha/solicitar',
  criarRateLimit({ janelaMs: 60_000, maximo: 5 }),
  solicitarSenha,
)
router.post(
  '/senha/redefinir',
  criarRateLimit({ janelaMs: 60_000, maximo: 10 }),
  redefinirSenha,
)
router.post('/logout', carregarCidadao, logout)
router.get('/sessao', carregarCidadao, sessao)

router.get('/perfil', exigirCidadao, perfil)
router.put('/perfil', exigirCidadao, atualizar)
router.get('/dados', exigirCidadao, exportarDados)
router.delete('/conta', exigirCidadao, excluir)

router.get('/solicitacoes', exigirCidadao, listarSolicitacoes)
router.post('/solicitacoes/vincular', exigirCidadao, vincularPedido)
router.get('/solicitacoes/:protocolo', exigirCidadao, detalharSolicitacao)
router.post('/solicitacoes/:protocolo/avaliacao', exigirCidadao, avaliarPedido)

export default router
