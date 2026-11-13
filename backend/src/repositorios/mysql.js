/**
 * Pool MySQL compartilhado pelo catálogo administrativo.
 *
 * A configuração vem exclusivamente do ambiente (`DB_HOST`, `DB_PORT`,
 * `DB_NAME`, `DB_USER`, `DB_PASSWORD`). Sem essas variáveis o piloto continua
 * funcionando com o catálogo em memória, útil para desenvolvimento e testes.
 * Em produção o `server.js` exige a conexão antes de abrir a porta.
 */
import mysql from 'mysql2/promise'

const configuracao = {
  host: process.env.DB_HOST || '',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: Math.max(1, Number(process.env.DB_POOL_SIZE) || 5),
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
}

export const mysqlConfigurado = Boolean(
  configuracao.host && configuracao.user && configuracao.database,
)

let pool = null

export function obterPool() {
  if (!mysqlConfigurado) return null
  if (!pool) pool = mysql.createPool(configuracao)
  return pool
}

export async function fecharPool() {
  if (!pool) return
  const atual = pool
  pool = null
  await atual.end()
}
