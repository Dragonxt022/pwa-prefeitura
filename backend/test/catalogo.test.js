import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buscarSecretaria,
  buscarServico,
  listarSecretarias,
  listarServicos,
  listarSetores,
  secretariaDoSetor,
  secretariasSemente,
  servicosSemente,
  setorDoServico,
  setoresSemente,
} from '../src/dominio/catalogo.js'

const SECRETARIAS_ESPERADAS = {
  comunicacao: { sigla: 'GABINETE', slug: 'comunicacao-gabinete' },
  testes: { sigla: 'TESTES', slug: 'secretaria-testes' },
  sema: { sigla: 'SEMA', slug: 'sema-secretaria-municipal-de-meio-ambiente' },
  semagri: { sigla: 'SEMAGRI', slug: 'semagri-secretaria-municipal-de-agricultura' },
  semas: { sigla: 'SEMAS', slug: 'semas-secretaria-do-municipio-de-assist-social' },
  semecd: { sigla: 'SEMECD', slug: 'semecd-secretaria-do-municipio-de-educacao' },
  semel: { sigla: 'SEMEL', slug: 'semel-secretaria-municipal-de-esportes' },
  semiu: { sigla: 'SEMIU', slug: 'semiu-secretaria-municipal-de-infraestrutura-e-urbanismo' },
  semosp: { sigla: 'SEMOSP', slug: 'semosp-secretaria-municipal-de-obras' },
  semsau: { sigla: 'SEMSAU', slug: 'semsau-secretaria-municipal-de-saude' },
  seplan: { sigla: 'SEPLAN', slug: 'seplan-secretaria-de-planejamento' },
}

test('catálogo tem as 11 secretarias oficiais', () => {
  assert.equal(secretariasSemente.length, 11)
  assert.equal(new Set(secretariasSemente.map((secretaria) => secretaria.id)).size, 11)
  assert.equal(new Set(secretariasSemente.map((secretaria) => secretaria.slug)).size, 11)
  assert.deepEqual(
    Object.fromEntries(
      secretariasSemente.map((secretaria) => [
        secretaria.id,
        { sigla: secretaria.sigla, slug: secretaria.slug },
      ]),
    ),
    SECRETARIAS_ESPERADAS,
  )
  for (const secretaria of secretariasSemente) {
    assert.ok(secretaria.nome, `secretaria ${secretaria.id} sem nome`)
    assert.equal(secretaria.ativo, true)
  }
  assert.equal(buscarSecretaria('testes')?.teste, true)
})

test('busca e listagem de secretarias', () => {
  assert.equal(buscarSecretaria('sema')?.nome, 'Secretaria Municipal de Meio Ambiente')
  assert.equal(buscarSecretaria('inexistente'), null)

  const lista = listarSecretarias()
  assert.equal(lista.length, 11)
  lista[0].nome = 'Alterado'
  assert.notEqual(secretariasSemente[0].nome, 'Alterado')
})

test('setores apontam apenas para secretarias existentes', () => {
  for (const setor of setoresSemente) {
    if (setor.secretariaId === null || setor.secretariaId === undefined) continue
    assert.ok(
      buscarSecretaria(setor.secretariaId),
      `setor ${setor.id} aponta para secretaria inexistente`,
    )
  }

  assert.equal(secretariaDoSetor('meio_ambiente')?.sigla, 'SEMA')
  assert.equal(secretariaDoSetor('infraestrutura')?.sigla, 'SEMOSP')
  assert.equal(secretariaDoSetor('triagem')?.sigla, 'GABINETE')
  assert.equal(secretariaDoSetor('zeladoria'), null)
  assert.equal(secretariaDoSetor('inexistente'), null)
})

test('Ouvidoria foi removida do catálogo', () => {
  assert.equal(listarSetores({ incluirInativos: true }).some((setor) => setor.id === 'ouvidoria'), false)
  assert.equal(listarServicos({ incluirInativos: true }).some((servico) => servico.id === 'ouvidoria'), false)
  assert.equal(setorDoServico('ouvidoria')?.id, 'triagem')
})

test('serviços são ligados a setores ativos e a lista do setor é derivada', () => {
  for (const servico of servicosSemente) {
    assert.ok(servico.setorId, `serviço ${servico.id} sem setor`)
    assert.ok(
      setoresSemente.some((setor) => setor.id === servico.setorId),
      `serviço ${servico.id} aponta para setor inexistente`,
    )
  }

  const setores = listarSetores()
  const infraestrutura = setores.find((setor) => setor.id === 'infraestrutura')
  assert.deepEqual(infraestrutura.servicos.sort(), ['iluminacao', 'pavimentacao'])
  assert.equal(buscarServico('poda')?.setorId, 'meio_ambiente')
  assert.equal(buscarServico('ouvidoria'), null)
})
