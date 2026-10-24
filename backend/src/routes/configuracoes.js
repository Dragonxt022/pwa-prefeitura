import { Router } from 'express'
import { obterConfiguracoesPublicas } from '../store.js'

const router = Router()

/**
 * Somente a identidade visual e os contatos públicos saem nesta rota.
 * SMTP, destinatários e configurações de IA permanecem no backend.
 */
router.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-cache')
  res.json({ dados: obterConfiguracoesPublicas() })
})

export default router
