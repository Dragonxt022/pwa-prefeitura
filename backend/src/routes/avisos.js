import { Router } from 'express'
import { listarAvisos } from '../store.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ dados: listarAvisos() })
})

export default router
