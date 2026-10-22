import { criarApp } from './src/app.js'

const porta = Number(process.env.PORT ?? 3000)
const app = criarApp()

const servidor = app.listen(porta, () => {
  console.log(`API mockada em http://localhost:${porta}/api/health`)
  console.log('Dados persistidos em backend/data/estado.json (ou em DATA_FILE).')
  console.log(
    `Painel de gestão em /gestao (token: ${process.env.ADMIN_TOKEN ? 'definido em ADMIN_TOKEN' : 'prefeitura-demo'}).`,
  )
})

servidor.on('error', (erro) => {
  if (erro.code === 'EADDRINUSE') {
    console.error(`A porta ${porta} já está em uso. Encerre o outro processo ou use PORT=3001 npm run dev.`)
    process.exit(1)
  }
  throw erro
})

function encerrar(sinal) {
  console.log(`\n${sinal} recebido, encerrando servidor...`)
  servidor.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGINT', () => encerrar('SIGINT'))
process.on('SIGTERM', () => encerrar('SIGTERM'))
