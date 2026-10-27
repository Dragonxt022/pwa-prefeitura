import assert from 'node:assert/strict'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { verificarHashToken } from '../src/utils/seguranca.js'

let contador = 0

function novoDiretorio() {
  return mkdtempSync(join(tmpdir(), 'prefeitura-estado-'))
}

function importarEstado(arquivo) {
  contador += 1
  return import(`../src/repositorios/estado.js?caso=${contador}`)
}

test('grava de forma atômica e mantém uma cópia de backup', async () => {
  const diretorio = novoDiretorio()
  const arquivo = join(diretorio, 'estado.json')
  process.env.DATA_FILE = arquivo

  try {
    const { estado, persistir } = await importarEstado(arquivo)
    estado.sequencia = 77
    persistir()

    assert.equal(JSON.parse(readFileSync(arquivo, 'utf8')).sequencia, 77)
    assert.equal(existsSync(`${arquivo}.tmp`), false)
    assert.equal(existsSync(`${arquivo}.bak`), false)

    estado.sequencia = 88
    persistir()

    assert.equal(JSON.parse(readFileSync(arquivo, 'utf8')).sequencia, 88)
    assert.equal(JSON.parse(readFileSync(`${arquivo}.bak`, 'utf8')).sequencia, 77)
    assert.equal(existsSync(`${arquivo}.tmp`), false)
  } finally {
    rmSync(diretorio, { recursive: true, force: true })
  }
})

test('recupera o estado do backup quando o arquivo principal está corrompido', async () => {
  const diretorio = novoDiretorio()
  const arquivo = join(diretorio, 'estado.json')
  process.env.DATA_FILE = arquivo

  try {
    const { estado, persistir } = await importarEstado(arquivo)
    estado.sequencia = 41
    persistir()
    estado.sequencia = 42
    persistir()

    writeFileSync(arquivo, '{ isto não é json', 'utf8')
    const { estado: recuperado } = await importarEstado(arquivo)

    assert.equal(recuperado.sequencia, 41)
    assert.ok(recuperado.solicitacoes.length > 0)
  } finally {
    rmSync(diretorio, { recursive: true, force: true })
  }
})

test('recupera do backup quando o principal é JSON válido mas o schema está incompleto', async () => {
  const diretorio = novoDiretorio()
  const arquivo = join(diretorio, 'estado.json')
  process.env.DATA_FILE = arquivo

  try {
    const { estado, persistir } = await importarEstado(arquivo)
    estado.sequencia = 41
    persistir()
    estado.sequencia = 42
    persistir()

    writeFileSync(arquivo, JSON.stringify({ versao: 4 }), 'utf8')
    const { estado: recuperado, persistir: persistirRecuperado } = await importarEstado(arquivo)

    assert.equal(recuperado.sequencia, 41)
    assert.ok(recuperado.solicitacoes.length > 0)

    recuperado.sequencia = 43
    persistirRecuperado()

    assert.equal(JSON.parse(readFileSync(arquivo, 'utf8')).sequencia, 43)
    assert.equal(JSON.parse(readFileSync(`${arquivo}.bak`, 'utf8')).sequencia, 41)
  } finally {
    rmSync(diretorio, { recursive: true, force: true })
  }
})

test('falha ao iniciar quando principal e backup estão inválidos', async () => {
  const diretorio = novoDiretorio()
  const arquivo = join(diretorio, 'estado.json')
  process.env.DATA_FILE = arquivo

  try {
    writeFileSync(arquivo, '{ inválido', 'utf8')
    writeFileSync(`${arquivo}.bak`, 'também inválido', 'utf8')

    await assert.rejects(importarEstado(arquivo), /estão inválidos/i)
  } finally {
    rmSync(diretorio, { recursive: true, force: true })
  }
})

test('não substitui estado local inválido por sementes silenciosamente', async () => {
  const diretorio = novoDiretorio()
  const arquivo = join(diretorio, 'estado.json')
  process.env.DATA_FILE = arquivo

  try {
    writeFileSync(arquivo, JSON.stringify({ solicitacoes: 'não é lista' }), 'utf8')

    await assert.rejects(importarEstado(arquivo), /solicitacoes/i)
  } finally {
    rmSync(diretorio, { recursive: true, force: true })
  }
})

test('não usa sementes quando o arquivo existe mas não tem lista de solicitações', async () => {
  const diretorio = novoDiretorio()
  const arquivo = join(diretorio, 'estado.json')
  process.env.DATA_FILE = arquivo

  try {
    writeFileSync(arquivo, JSON.stringify({ versao: 3 }), 'utf8')

    await assert.rejects(importarEstado(arquivo), /solicitacoes/i)
  } finally {
    rmSync(diretorio, { recursive: true, force: true })
  }
})

test('migra os protocolos de demonstração para o código documentado', async () => {
  const diretorio = novoDiretorio()
  const arquivo = join(diretorio, 'estado.json')
  process.env.DATA_FILE = arquivo

  try {
    const { estado, persistir } = await importarEstado(arquivo)
    const semente = estado.solicitacoes.find(
      (item) => item.protocolo === 'PREF-2026-000001',
    )

    assert.ok(semente)
    assert.match(semente.codigoAcessoHash, /^[a-f0-9]{64}$/)
    assert.equal(
      verificarHashToken('DEMA-ACES-S226', semente.codigoAcessoHash),
      true,
    )

    persistir()
    const salvo = readFileSync(arquivo, 'utf8')
    assert.ok(!salvo.includes('DEMA-ACES-S226'))
    assert.ok(!salvo.includes('"codigoAcesso"'))
  } finally {
    rmSync(diretorio, { recursive: true, force: true })
  }
})
