import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CODIGO_ACESSO_ALFABETO,
  CODIGO_ACESSO_TAMANHO,
  codigoAcessoValido,
  gerarCodigoAcesso,
  normalizarCodigoAcesso,
} from '../../shared/codigo-acesso.js'

test('gera códigos no formato esperado, sem caracteres ambíguos', () => {
  const gerado = gerarCodigoAcesso()
  assert.match(gerado, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  assert.equal(codigoAcessoValido(gerado), true)
  assert.equal(normalizarCodigoAcesso(gerado), gerado)
  assert.equal(gerado.replaceAll('-', '').length, CODIGO_ACESSO_TAMANHO)
  assert.ok(!/[IO01]/.test(gerado))
  assert.equal(CODIGO_ACESSO_ALFABETO.length, 32)
})

test('gera códigos diferentes em chamadas consecutivas', () => {
  const codigos = new Set(Array.from({ length: 20 }, gerarCodigoAcesso))
  assert.equal(codigos.size, 20)
})

test('normaliza progressivamente e aceita minúsculas sem separadores', () => {
  assert.equal(normalizarCodigoAcesso('abcd'), 'ABCD')
  assert.equal(normalizarCodigoAcesso('abcdefgh'), 'ABCD-EFGH')
  assert.equal(normalizarCodigoAcesso('abcdefghjklm'), 'ABCD-EFGH-JKLM')
  assert.equal(normalizarCodigoAcesso(' abcd efgh jklm '), 'ABCD-EFGH-JKLM')
  assert.equal(codigoAcessoValido('abcd-efgh-jklm'), true)
  assert.equal(codigoAcessoValido('ABCDEFGHJKLM'), true)
})

test('rejeita códigos incompletos ou com caracteres ambíguos', () => {
  assert.equal(codigoAcessoValido(''), false)
  assert.equal(codigoAcessoValido('ABCD-EFGH-JKL'), false)
  assert.equal(codigoAcessoValido('ABCD-EFGH-JKLI'), false)
  assert.equal(codigoAcessoValido('ABCD-EFGH-JKL0'), false)
  assert.equal(codigoAcessoValido('ABCD-EFGH-JKL1'), false)
  assert.equal(codigoAcessoValido('ABCD-EFGH-JKLO'), false)
})
