import { Router } from 'express'
import { perfil } from '../store.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ dados: perfil })
})

export default router
