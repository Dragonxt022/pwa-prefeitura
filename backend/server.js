import { criarApp } from './src/app.js'
import { fecharPool } from './src/repositorios/mysql.js'
import { inicializarDados } from './src/repositorios/estado.js'
import { inicializarCatalogo } from './src/servicos/catalogo.js'
import { triagemAutomaticaAtiva } from './src/servicos/configuracoes.js'

const porta = Number(process.env.PORT ?? 3000)

let catalogo
let dados
try {
  // O catálogo vem primeiro para que a normalização das solicitações use os
  // setores e serviços efetivamente cadastrados no banco.
  catalogo = await inicializarCatalogo()
  dados = await inicializarDados()
} catch (erro) {
  console.error('[dados] falha ao inicializar a persistência:', erro.message)
  process.exit(1)
}

const app = criarApp()

const servidor = app.listen(porta, () => {
  console.log(`API em http://localhost:${porta}/api/health`)
  console.log(
    catalogo.persistencia === 'mysql'
      ? 'Catálogo persistido no MySQL.'
      : 'DB_HOST/DB_USER/DB_NAME ausentes; catálogo em memória (não persiste reinícios).',
  )
  console.log(
    dados.persistencia === 'mysql'
      ? 'Solicitações, usuários, sessões e configurações persistidos no MySQL.'
      : 'Solicitações, usuários, sessões e configurações em backend/data/estado.json (ou DATA_FILE).',
  )
  console.log(
    `Painel de gestão em /gestao (login: admin@prefeitura.demo ou triagem@prefeitura.demo; ${
      process.env.DEMO_PASSWORD ? 'senha definida em DEMO_PASSWORD' : 'senha demo: prefeitura-demo'
    }).`,
  )
  console.log('Configurações e catálogo administrativos em /gestao (somente admin para editar).')
  console.log(
    `Triagem automática: ${triagemAutomaticaAtiva() ? 'ativada' : 'desativada (triagem manual)'}.`,
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
  servidor.close(async () => {
    await fecharPool().catch(() => {})
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGINT', () => encerrar('SIGINT'))
process.on('SIGTERM', () => encerrar('SIGTERM'))
