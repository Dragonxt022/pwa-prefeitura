import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'
import {
  listarAvisos as listarAvisosPublicos,
  obterAviso as obterAvisoPublico,
} from '../src/controladores/catalogo.js'
import {
  aplicarAvisos,
  avisosSemente,
  buscarAviso,
  buscarAvisoPublico,
  listarAvisos,
} from '../src/dominio/avisos.js'
import * as repositorioAvisos from '../src/repositorios/avisos.js'
import {
  atualizarAviso,
  criarAviso,
  excluirAviso,
  inicializarAvisos,
  listarAuditoriaAvisos,
  obterAvisos,
} from '../src/servicos/avisos.js'
import {
  validarAtualizacaoAviso,
  validarCriacaoAviso,
} from '../src/validadores/avisos.js'

const ATOR = { id: 'u-admin', nome: 'Admin Teste' }

function respostaPublica() {
  let resposta
  listarAvisosPublicos({}, { json: (payload) => { resposta = payload } })
  return resposta
}

function respostaDetalhe(id) {
  let resposta
  obterAvisoPublico(
    { params: { id } },
    { json: (payload) => { resposta = payload } },
  )
  return resposta
}

beforeEach(async () => {
  repositorioAvisos.reiniciarMemoria()
  aplicarAvisos(avisosSemente)
  await inicializarAvisos()
})

test('avisos públicos ficam ordenados do mais recente para o mais antigo', () => {
  const lista = listarAvisos()
  assert.equal(lista.length, 4)
  const datas = lista.map((aviso) => new Date(aviso.publicadoEm).getTime())
  assert.deepEqual(datas, [...datas].sort((a, b) => b - a))
  assert.deepEqual(
    lista.map((aviso) => aviso.id),
    ['aviso-1', 'aviso-2', 'aviso-3', 'aviso-4'],
  )
})

test('avisos inativos e com data futura não aparecem para o cidadão', () => {
  aplicarAvisos([
    ...avisosSemente,
    {
      id: 'futuro',
      titulo: 'Agendado',
      resumo: 'Aviso que ainda não deve ser publicado na Home.',
      categoria: 'Serviço',
      prioridade: 'normal',
      publicadoEm: '2099-01-01T10:00:00-04:00',
      ativo: true,
    },
    {
      id: 'inativo',
      titulo: 'Desativado',
      resumo: 'Aviso desativado no painel e que não deve aparecer.',
      categoria: 'Serviço',
      prioridade: 'normal',
      publicadoEm: '2026-10-01T10:00:00-04:00',
      ativo: false,
    },
  ])

  const publicos = listarAvisos()
  assert.equal(publicos.some((aviso) => aviso.id === 'futuro'), false)
  assert.equal(publicos.some((aviso) => aviso.id === 'inativo'), false)
  assert.equal(listarAvisos({ incluirInativos: true }).length, 6)
  assert.equal(buscarAviso('inativo')?.ativo, false)
})

test('contrato público não expõe campos internos do painel', () => {
  const resposta = respostaPublica()
  assert.equal(resposta.dados.length, 4)
  for (const aviso of resposta.dados) {
    assert.equal(aviso.ativo, undefined)
    assert.equal(aviso.criadoEm, undefined)
    assert.equal(aviso.atualizadoEm, undefined)
    assert.ok(aviso.titulo)
    assert.ok(aviso.publicadoEm)
    assert.ok(aviso.conteudo)
  }
})

test('detalhe público devolve o conteúdo completo do aviso', () => {
  const resposta = respostaDetalhe('aviso-1')
  assert.equal(resposta.dados.id, 'aviso-1')
  assert.equal(resposta.dados.icone, 'paw-print')
  assert.equal(resposta.dados.cor, 'coral')
  assert.match(resposta.dados.conteudo, /vacinação antirrábica/i)
  assert.equal(resposta.dados.ativo, undefined)
  assert.equal(resposta.dados.criadoEm, undefined)
})

test('detalhe público não encontra aviso inativo, futuro ou inexistente', () => {
  aplicarAvisos([
    ...avisosSemente,
    {
      id: 'futuro',
      titulo: 'Agendado',
      resumo: 'Aviso que ainda não deve ser publicado na Home.',
      categoria: 'Serviço',
      prioridade: 'normal',
      publicadoEm: '2099-01-01T10:00:00-04:00',
      ativo: true,
    },
    {
      id: 'inativo',
      titulo: 'Desativado',
      resumo: 'Aviso desativado no painel e que não deve aparecer.',
      categoria: 'Serviço',
      prioridade: 'normal',
      publicadoEm: '2026-10-01T10:00:00-04:00',
      ativo: false,
    },
  ])

  assert.equal(buscarAvisoPublico('futuro'), null)
  assert.equal(buscarAvisoPublico('inativo'), null)
  assert.throws(() => respostaDetalhe('nao_existe'), (erro) => {
    assert.equal(erro.name, 'AppError')
    assert.equal(erro.status, 404)
    return true
  })
})

test('validação rejeita título, resumo, conteúdo, categoria e prioridade inválidos', () => {
  assert.throws(
    () =>
      validarCriacaoAviso({
        titulo: 'ab',
        resumo: 'curto',
        conteudo: 'curto',
        categoria: '',
        prioridade: 'urgente',
      }),
    (erro) => {
      assert.equal(erro.name, 'AppError')
      assert.ok(erro.campos.titulo)
      assert.ok(erro.campos.resumo)
      assert.ok(erro.campos.conteudo)
      assert.ok(erro.campos.categoria)
      assert.ok(erro.campos.prioridade)
      return true
    },
  )
})

test('validação normaliza prioridade, data, textos e aparência', () => {
  const dados = validarCriacaoAviso({
    titulo: '  Nova unidade de saúde  ',
    resumo: '  Atendimento começa na segunda-feira.  ',
    conteudo: '  A unidade abre às 7h e atende até as 19h.  ',
    categoria: ' Saúde ',
    icone: 'hospital',
    cor: 'teal',
    prioridade: 'ALTA',
    publicadoEm: '2026-11-20T10:00:00-04:00',
  })
  assert.equal(dados.titulo, 'Nova unidade de saúde')
  assert.equal(dados.resumo, 'Atendimento começa na segunda-feira.')
  assert.equal(dados.conteudo, 'A unidade abre às 7h e atende até as 19h.')
  assert.equal(dados.categoria, 'Saúde')
  assert.equal(dados.icone, 'hospital')
  assert.equal(dados.cor, 'teal')
  assert.equal(dados.prioridade, 'alta')
  assert.equal(dados.publicadoEm, '2026-11-20T14:00:00.000Z')
  assert.equal(dados.ativo, true)
})

test('validação rejeita ícone e cor fora do catálogo visual', () => {
  assert.throws(
    () =>
      validarCriacaoAviso({
        titulo: 'Aviso válido',
        resumo: 'Resumo suficientemente longo para o teste.',
        conteudo: 'Conteúdo completo do aviso para o teste de validação.',
        categoria: 'Serviço',
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

test('atualização exige ao menos um campo', () => {
  assert.throws(() => validarAtualizacaoAviso({}), (erro) => {
    assert.equal(erro.name, 'AppError')
    return true
  })
})

test('cria aviso com id derivado, prioridade padrão e auditoria', async () => {
  const resultado = await criarAviso(
    {
      titulo: 'Mutirão de vacinação',
      resumo: 'Atendimento ampliado neste sábado em todas as unidades.',
      conteudo: 'Todas as unidades abrem das 8h às 17h para atualização da caderneta.',
      categoria: 'Saúde',
      icone: 'stethoscope',
      cor: 'roxo',
    },
    ATOR,
  )

  assert.equal(resultado.campos, undefined)
  assert.equal(resultado.registro.id, 'mutirao_de_vacinacao')
  assert.equal(resultado.registro.conteudo, 'Todas as unidades abrem das 8h às 17h para atualização da caderneta.')
  assert.equal(resultado.registro.icone, 'stethoscope')
  assert.equal(resultado.registro.cor, 'roxo')
  assert.equal(resultado.registro.prioridade, 'normal')
  assert.equal(resultado.registro.ativo, true)
  assert.ok(resultado.registro.publicadoEm)

  assert.equal(listarAvisos().length, 5)
  assert.equal(listarAvisos()[0].id, 'mutirao_de_vacinacao')

  const auditoria = await listarAuditoriaAvisos()
  assert.equal(auditoria.length, 1)
  assert.equal(auditoria[0].acao, 'criado')
  assert.equal(auditoria[0].usuarioNome, 'Admin Teste')
  assert.equal(auditoria[0].dadosDepois.titulo, 'Mutirão de vacinação')
})

test('não permite dois avisos com o mesmo título', async () => {
  const resultado = await criarAviso(
    {
      titulo: 'Vacinação antirrábica neste sábado',
      resumo: 'Repetição do aviso já cadastrado para o teste.',
      categoria: 'Saúde',
    },
    ATOR,
  )
  assert.ok(resultado.campos.titulo)
  assert.equal(listarAvisos().length, 4)
})

test('atualiza e desativa um aviso, recarregando o cache público', async () => {
  const alterado = await atualizarAviso(
    'aviso-2',
    { titulo: 'Manutenção concluída', ativo: false },
    ATOR,
  )

  assert.equal(alterado.registro.titulo, 'Manutenção concluída')
  assert.equal(alterado.registro.ativo, false)
  assert.equal(listarAvisos().some((aviso) => aviso.id === 'aviso-2'), false)
  assert.equal(
    listarAvisos({ incluirInativos: true }).find((aviso) => aviso.id === 'aviso-2')?.titulo,
    'Manutenção concluída',
  )

  const auditoria = await listarAuditoriaAvisos()
  assert.equal(auditoria[0].acao, 'atualizado')
  assert.equal(auditoria[0].dadosAntes.titulo, 'Manutenção programada no portal')
})

test('atualização de aviso inexistente informa não encontrado', async () => {
  const resultado = await atualizarAviso('nao_existe', { titulo: 'Outro título' }, ATOR)
  assert.equal(resultado.naoEncontrado, true)
})

test('aviso expirado é desativado e some da listagem pública', async () => {
  await inicializarAvisos()
  const agora = Date.now()
  const criado = await criarAviso(
    {
      titulo: 'Campanha encerrada',
      resumo: 'Este aviso já passou da data de expiração.',
      conteudo: 'Conteúdo completo do aviso expirado para validar a regra.',
      categoria: 'Serviço',
      publicadoEm: new Date(agora - 86_400_000).toISOString(),
      expiraEm: new Date(agora - 3_600_000).toISOString(),
      desativarAoExpirar: true,
    },
    ATOR,
  )

  assert.ok(criado.registro.id)
  assert.equal(buscarAvisoPublico(criado.registro.id), null)
  assert.equal(
    obterAvisos().avisos.find((aviso) => aviso.id === criado.registro.id)?.ativo,
    false,
  )
})

test('detalhe público incrementa a contagem de visualizações', () => {
  aplicarAvisos(avisosSemente)
  const antes = buscarAviso('aviso-1').visualizacoes ?? 0
  respostaDetalhe('aviso-1')
  respostaDetalhe('aviso-1')
  assert.equal(buscarAviso('aviso-1').visualizacoes, antes + 2)
})

test('exclui aviso, sai do cache e registra auditoria', async () => {
  const resultado = await excluirAviso('aviso-1', ATOR)
  assert.equal(resultado.registro.id, 'aviso-1')
  assert.equal(buscarAviso('aviso-1'), null)
  assert.equal(listarAvisos({ incluirInativos: true }).some((aviso) => aviso.id === 'aviso-1'), false)

  const auditoria = await listarAuditoriaAvisos()
  assert.equal(auditoria[0].acao, 'excluido')
  assert.equal(auditoria[0].avisoId, 'aviso-1')
})



test('obterAvisos do painel inclui inativos e a persistência em uso', () => {
  const dados = obterAvisos()
  assert.equal(dados.persistencia, 'memoria')
  assert.equal(dados.avisos.length, 4)
  assert.ok(dados.avisos.every((aviso) => typeof aviso.ativo === 'boolean'))
})
