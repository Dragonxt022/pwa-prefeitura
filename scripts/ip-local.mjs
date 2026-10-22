/**
 * Lista os IPv4 da rede local e as URLs para abrir no celular.
 * Uso: node scripts/ip-local.mjs 5173 [4173 ...]
 */
import { networkInterfaces } from 'node:os'

const VIRTUAIS = /(loopback|wsl|vethernet|virtualbox|vmware|hyper-v|tailscale|zerotier|bluetooth)/i

const portas = process.argv.slice(2).filter(Boolean)
const alvos = portas.length > 0 ? portas : ['5173']

const encontrados = []
for (const [nome, lista] of Object.entries(networkInterfaces())) {
  for (const item of lista ?? []) {
    if (item.family !== 'IPv4' || item.internal) continue
    encontrados.push({ nome, ip: item.address, virtual: VIRTUAIS.test(nome) })
  }
}

const reais = encontrados.filter((item) => !item.virtual)
const candidatos = reais.length > 0 ? reais : encontrados

if (candidatos.length === 0) {
  console.log('  Nenhum IPv4 de rede local encontrado. Conecte-se ao Wi-Fi e tente novamente.')
  process.exit(0)
}

console.log('  Interfaces detectadas:')
for (const { nome, ip, virtual } of encontrados) {
  console.log(`    ${ip.padEnd(15)} ${nome}${virtual ? '  (virtual, ignore)' : ''}`)
}

console.log('')
console.log('  Abra no celular (mesma rede Wi-Fi):')
for (const { ip } of candidatos) {
  for (const porta of alvos) {
    console.log(`    http://${ip}:${porta}`)
  }
}
