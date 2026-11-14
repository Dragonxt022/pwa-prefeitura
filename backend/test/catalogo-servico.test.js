import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after, beforeEach } from 'node:test'

const diretorio = mkdtempSync(join(tmpdir(), 'prefeitura-catalogo-'))
process.env.DATA_FILE = join(diretorio, 'estado.json')

const repositorioCatalogo = await import('../src/repositorios/catalogo.js')
const servicoCatalogo = await import('../src/servicos/catalogo.js')
const { validarCriacaoServico } = await import('../src/validadores/catalogo.js')

const ator = { id: 'admin-teste', nome: 'Admin Teste' }

beforeEach(async () => {
  repositorioCatalogo.reiniciarMemoria()
  await servicoCatalogo.inicializarCatalogo()
})

after(() => {
  rmSync(diretorio, { recursive: true, force: true })
})

test('semente do catálogo não tem Ouvidoria e mantém a hierarquia', () => {
  const catalogo = servicoCatalogo.obterCatalogo()
  assert.equal(catalogo.persistencia, 'memoria')
  assert.equal(catalogo.secretarias.length, 11)
  assert.equal(catalogo.setores.length, 6)
  assert.equal(catalogo.servicos.length, 8)
  assert.equal(catalogo.setores.some((setor) => setor.id === 'ouvidoria'), false)
  assert.equal(catalogo.servicos.some((servico) => servico.id === 'ouvidoria'), false)
  assert.deepEqual(
    catalogo.setores.find((setor) => setor.id === 'infraestrutura').servicos.sort(),
    ['iluminacao', 'pavimentacao'],
  )
})

test('cria e atualiza secretaria com auditoria', async () => {
  const criada = await servicoCatalogo.criarSecretaria(
    {
      sigla: 'SEMTUR',
      nome: 'Secretaria Municipal de Turismo',
      slug: 'semtur-secretaria-municipal-de-turismo',
      ativo: true,
      teste: false,
    },
    ator,
  )
  assert.equal(criada.campos, undefined)
  assert.equal(criada.registro.id, 'semtur')
  assert.equal(criada.registro.nome, 'Secretaria Municipal de Turismo')

  const atualizada = await servicoCatalogo.atualizarSecretaria(
    'semtur',
    { nome: 'Secretaria de Turismo e Cultura' },
    ator,
  )
  assert.equal(atualizada.registro.nome, 'Secretaria de Turismo e Cultura')

  const auditoria = await servicoCatalogo.listarAuditoriaCatalogo()
  assert.equal(auditoria[0].entidade, 'secretaria')
  assert.equal(auditoria[0].acao, 'atualizado')
  assert.equal(auditoria[0].usuarioNome, 'Admin Teste')
  assert.equal(auditoria[1].acao, 'criado')
})

test('impede sigla e slug duplicados, inclusive contra sementes', async () => {
  const sigla = await servicoCatalogo.criarSecretaria(
    { sigla: 'SEMA', nome: 'Outra secretaria', slug: 'outra-secretaria' },
    ator,
  )
  assert.ok(sigla.campos.sigla)

  const slug = await servicoCatalogo.criarSecretaria(
    { sigla: 'OUTRA', nome: 'Outra secretaria', slug: 'sema-secretaria-municipal-de-meio-ambiente' },
    ator,
  )
  assert.ok(slug.campos.slug)
})

test('bloqueia desativação de setor com solicitação aberta', async () => {
  const resultado = await servicoCatalogo.atualizarSetor('infraestrutura', { ativo: false }, ator)
  assert.ok(resultado.campos.ativo)
  assert.match(resultado.campos.ativo, /solicitação\(ões\) aberta/)
})

test('bloqueia desativação da triagem central', async () => {
  const resultado = await servicoCatalogo.atualizarSetor('triagem', { ativo: false }, ator)
  assert.match(resultado.campos.ativo, /triagem central/)
})

test('bloqueia desativação de serviço com solicitação aberta', async () => {
  const bloqueado = await servicoCatalogo.atualizarServico('iluminacao', { ativo: false }, ator)
  assert.match(bloqueado.campos.ativo, /solicitação\(ões\) aberta/)
  assert.equal(
    (await servicoCatalogo.atualizarServico('poda', { ativo: false }, ator)).registro.ativo,
    false,
  )
})

test('fluxo completo de secretaria, setor e serviço novos', async () => {
  const secretaria = await servicoCatalogo.criarSecretaria(
    { sigla: 'SEMTUR', nome: 'Secretaria de Turismo', slug: 'secretaria-de-turismo' },
    ator,
  )
  assert.equal(secretaria.registro.ativo, true)

  const setor = await servicoCatalogo.criarSetor(
    { nome: 'Turismo e Eventos', descricao: 'Roteiros e eventos.', secretariaId: 'semtur' },
    ator,
  )
  assert.equal(setor.registro.id, 'turismo_e_eventos')
  assert.equal(setor.registro.central, false)

  const servico = await servicoCatalogo.criarServico(
    {
      titulo: 'Informações turísticas',
      descricao: 'Orientação sobre pontos turísticos.',
      categoria: 'Turismo',
      prazoDias: 5,
      ordem: 10,
      destaque: false,
      novo: true,
      setorId: setor.registro.id,
      icone: 'map-pin',
      cor: 'roxo',
    },
    ator,
  )
  assert.equal(servico.registro.id, 'informacoes_turisticas')
  assert.equal(servico.registro.setorId, setor.registro.id)
  assert.equal(servico.registro.icone, 'map-pin')
  assert.equal(servico.registro.cor, 'roxo')

  const setorComServico = servicoCatalogo
    .obterCatalogo()
    .setores.find((item) => item.id === setor.registro.id)
  assert.deepEqual(setorComServico.servicos, [servico.registro.id])

  // Serviço ativo impede desativar o setor; setor ativo impede desativar a
  // secretaria. O bloqueio é resolvido na ordem inversa da hierarquia.
  const setorBloqueado = await servicoCatalogo.atualizarSetor(
    setor.registro.id,
    { ativo: false },
    ator,
  )
  assert.match(setorBloqueado.campos.ativo, /serviços ativos/)

  const secretariaBloqueada = await servicoCatalogo.atualizarSecretaria(
    'semtur',
    { ativo: false },
    ator,
  )
  assert.match(secretariaBloqueada.campos.ativo, /setores ativos/)

  assert.equal(
    (await servicoCatalogo.atualizarServico(servico.registro.id, { ativo: false }, ator)).registro.ativo,
    false,
  )
  assert.equal(
    (await servicoCatalogo.atualizarSetor(setor.registro.id, { ativo: false }, ator)).registro.ativo,
    false,
  )
  assert.equal(
    (await servicoCatalogo.atualizarSecretaria('semtur', { ativo: false }, ator)).registro.ativo,
    false,
  )
})

test('edita setor legado sem vínculo sem exigir secretaria', async () => {
  // Simula um setor criado antes de o vínculo com secretaria ser obrigatório.
  await repositorioCatalogo.criarSetor(
    {
      id: 'setor_sem_vinculo',
      nome: 'Setor Sem Vínculo',
      descricao: 'Ainda aguardando secretaria.',
      secretariaId: null,
      central: false,
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    ator,
  )
  await servicoCatalogo.inicializarCatalogo()

  const antes = servicoCatalogo
    .obterCatalogo()
    .setores.find((setor) => setor.id === 'setor_sem_vinculo')
  assert.equal(antes.secretariaId, null)

  const resultado = await servicoCatalogo.atualizarSetor(
    'setor_sem_vinculo',
    { descricao: 'Descrição revisada sem vínculo.' },
    ator,
  )
  assert.equal(resultado.registro.secretariaId, null)
  assert.equal(resultado.registro.descricao, 'Descrição revisada sem vínculo.')
})

test('serviço pode ser movido para outro setor ativo', async () => {
  const resultado = await servicoCatalogo.atualizarServico(
    'poda',
    { setorId: 'infraestrutura', prazoDias: 12 },
    ator,
  )
  assert.equal(resultado.registro.setorId, 'infraestrutura')
  assert.equal(resultado.registro.prazoDias, 12)
  const catalogo = servicoCatalogo.obterCatalogo()
  assert.equal(
    catalogo.setores.find((setor) => setor.id === 'infraestrutura').servicos.includes('poda'),
    true,
  )
})

test('validação rejeita ícone e cor fora do catálogo visual', () => {
  assert.throws(
    () =>
      validarCriacaoServico({
        titulo: 'Serviço de teste',
        descricao: 'Descrição do serviço de teste.',
        categoria: 'Teste',
        setorId: 'infraestrutura',
        icone: 'inexistente',
        cor: 'rosa',
      }),
    (erro) => {
      assert.ok(erro.campos.icone)
      assert.ok(erro.campos.cor)
      return true
    },
  )
})

test('atualiza e limpa a aparência do serviço', async () => {
  const atualizado = await servicoCatalogo.atualizarServico(
    'poda',
    { icone: 'leaf', cor: 'verde' },
    ator,
  )
  assert.equal(atualizado.registro.icone, 'leaf')
  assert.equal(atualizado.registro.cor, 'verde')

  const limpo = await servicoCatalogo.atualizarServico('poda', { icone: null, cor: null }, ator)
  assert.equal(limpo.registro.icone, null)
  assert.equal(limpo.registro.cor, null)
})

test('não encontra registros inexistentes', async () => {
  const resultado = await servicoCatalogo.atualizarServico('inexistente', { ativo: false }, ator)
  assert.equal(resultado.naoEncontrado, true)
})
