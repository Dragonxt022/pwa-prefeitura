import { Router } from 'express'
import { listarServicos } from '../store.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ dados: listarServicos() })
})

export default router
