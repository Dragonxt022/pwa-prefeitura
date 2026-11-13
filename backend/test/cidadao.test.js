import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after } from 'node:test'

const diretorio = mkdtempSync(join(tmpdir(), 'prefeitura-cidadao-'))
const arquivoDados = join(diretorio, 'estado.json')
process.env.DATA_FILE = arquivoDados
process.env.MOCK_LATENCY_MS = '0'

const { criarApp } = await import('../src/app.js')
const repositorioCidadaos = await import('../src/repositorios/cidadaos.js')
const servicoRecuperacao = await import('../src/servicos/recuperacao-senha.js')

const app = criarApp({ latenciaMs: 0 })
const servidor = await new Promise((resolver) => {
  const instancia = app.listen(0, '127.0.0.1', () => resolver(instancia))
})
const base = `http://127.0.0.1:${servidor.address().port}/api`

after(async () => {
  servidor.closeAllConnections?.()
  await new Promise((resolver) => servidor.close(resolver))
  rmSync(diretorio, { recursive: true, force: true })
})

async function chamar(caminho, { metodo = 'GET', corpo, cookie } = {}) {
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const payload = await resposta.json().catch(() => null)
  const cookies = resposta.headers.getSetCookie?.() ??
    [resposta.headers.get('set-cookie')].filter(Boolean)
  return { status: resposta.status, payload, cookies }
}

function cookieDaResposta(resposta) {
  return resposta.cookies.map((item) => item.split(';')[0]).join('; ')
}

const CADASTRO = {
  nome: 'Maria da Silva',
  email: 'maria.teste@example.invalid',
  senha: 'SenhaForte123',
  telefone: '69999998888',
  cep: '76800000',
  logradouro: 'Rua das Acácias',
  numero: '120',
  complemento: 'Casa',
  bairro: 'Centro',
  cidade: 'Cujubim',
  uf: 'RO',
  consentimento: true,
  lembrar: true,
}

test('cadastro do cidadão exige consentimento e não expõe segredos', async (t) => {
  await t.test('sessão sem login devolve null', async () => {
    const resposta = await chamar('/cidadao/sessao')
    assert.equal(resposta.status, 200)
    assert.equal(resposta.payload.dados, null)
  })

  await t.test('rejeita cadastro sem consentimento', async () => {
    const resposta = await chamar('/cidadao/cadastro', {
      metodo: 'POST',
      corpo: { ...CADASTRO, consentimento: false },
    })
    assert.equal(resposta.status, 422)
    assert.ok(resposta.payload.erro.campos.consentimento)
  })

  await t.test('rejeita campos inválidos', async () => {
    const resposta = await chamar('/cidadao/cadastro', {
      metodo: 'POST',
      corpo: { ...CADASTRO, email: 'invalido', telefone: '123', uf: 'R' },
    })
    assert.equal(resposta.status, 422)
    assert.ok(resposta.payload.erro.campos.email)
    assert.ok(resposta.payload.erro.campos.telefone)
    assert.ok(resposta.payload.erro.campos.uf)
  })

  let cookie = ''
  await t.test('cria a conta, autentica e devolve apenas dados públicos', async () => {
    const resposta = await chamar('/cidadao/cadastro', { metodo: 'POST', corpo: CADASTRO })
    assert.equal(resposta.status, 201)
    const cidadao = resposta.payload.dados.cidadao
    assert.equal(cidadao.nome, CADASTRO.nome)
    assert.equal(cidadao.email, CADASTRO.email)
    assert.equal(cidadao.telefone, CADASTRO.telefone)
    assert.equal(cidadao.uf, 'RO')
    assert.equal(cidadao.senha, undefined)
    assert.equal(cidadao.senhaHash, undefined)
    assert.ok(resposta.cookies.length > 0)
    cookie = cookieDaResposta(resposta)
  })

  await t.test('não grava senha em texto puro no estado', () => {
    const salvo = readFileSync(arquivoDados, 'utf8')
    assert.equal(salvo.includes(CADASTRO.senha), false)
    const estado = JSON.parse(salvo)
    assert.equal(estado.cidadaos[0].senha, undefined)
    assert.match(estado.cidadaos[0].senhaHash, /^scrypt\$/)
  })

  await t.test('sessão e perfil usam o cookie do próprio cidadão', async () => {
    const sessao = await chamar('/cidadao/sessao', { cookie })
    assert.equal(sessao.status, 200)
    assert.equal(sessao.payload.dados.cidadao.email, CADASTRO.email)

    const semCookie = await chamar('/cidadao/perfil')
    assert.equal(semCookie.status, 401)

    const perfil = await chamar('/cidadao/perfil', { cookie })
    assert.equal(perfil.status, 200)
    assert.equal(perfil.payload.dados.nome, CADASTRO.nome)
    assert.equal(perfil.payload.dados.senhaHash, undefined)
  })

  await t.test('duplicidade de e-mail é rejeitada sem apagar a conta existente', async () => {
    const resposta = await chamar('/cidadao/cadastro', {
      metodo: 'POST',
      corpo: { ...CADASTRO, nome: 'Outra Pessoa' },
    })
    assert.equal(resposta.status, 422)
    assert.ok(resposta.payload.erro.campos.email)
  })

  await t.test('atualiza o perfil mantendo o e-mail e trocando o endereço', async () => {
    const resposta = await chamar('/cidadao/perfil', {
      metodo: 'PUT',
      cookie,
      corpo: {
        telefone: '69988887777',
        cep: '76810000',
        logradouro: 'Avenida Central',
        numero: '45',
        complemento: '',
        bairro: 'Setor Novo',
        cidade: 'Cujubim',
        uf: 'RO',
      },
    })
    assert.equal(resposta.status, 200)
    assert.equal(resposta.payload.dados.telefone, '69988887777')
    assert.equal(resposta.payload.dados.logradouro, 'Avenida Central')
    assert.equal(resposta.payload.dados.bairro, 'Setor Novo')
    assert.equal(resposta.payload.dados.email, CADASTRO.email)
  })

  await t.test('exporta os dados pessoais da própria conta', async () => {
    const resposta = await fetch(`${base}/cidadao/dados`, {
      headers: { Cookie: cookie, Accept: 'application/json' },
    })
    assert.equal(resposta.status, 200)
    assert.match(resposta.headers.get('content-disposition') || '', /meus-dados/)
    const dados = await resposta.json()
    assert.equal(dados.cidadao.email, CADASTRO.email)
    assert.equal(dados.cidadao.senhaHash, undefined)
  })

  await t.test('logout revoga a sessão', async () => {
    const resposta = await chamar('/cidadao/logout', { metodo: 'POST', cookie })
    assert.equal(resposta.status, 200)
    const perfil = await chamar('/cidadao/perfil', { cookie })
    assert.equal(perfil.status, 401)
  })

  await t.test('login com senha errada é genérico e com senha certa reabre a sessão', async () => {
    const errado = await chamar('/cidadao/login', {
      metodo: 'POST',
      corpo: { email: CADASTRO.email, senha: 'senha-errada' },
    })
    assert.equal(errado.status, 401)
    assert.equal(errado.payload.erro.codigo, 'credenciais_invalidas')

    const certo = await chamar('/cidadao/login', {
      metodo: 'POST',
      corpo: { email: CADASTRO.email, senha: CADASTRO.senha },
    })
    assert.equal(certo.status, 200)
    cookie = cookieDaResposta(certo)
    const sessao = await chamar('/cidadao/sessao', { cookie })
    assert.equal(sessao.payload.dados.cidadao.email, CADASTRO.email)
  })

  await t.test('exclusão exige a senha e apaga os dados pessoais', async () => {
    const semSenha = await chamar('/cidadao/conta', {
      metodo: 'DELETE',
      cookie,
      corpo: {},
    })
    assert.equal(semSenha.status, 422)

    const errada = await chamar('/cidadao/conta', {
      metodo: 'DELETE',
      cookie,
      corpo: { senha: 'senha-errada' },
    })
    assert.equal(errada.status, 401)

    const excluida = await chamar('/cidadao/conta', {
      metodo: 'DELETE',
      cookie,
      corpo: { senha: CADASTRO.senha },
    })
    assert.equal(excluida.status, 200)

    const perfil = await chamar('/cidadao/perfil', { cookie })
    assert.equal(perfil.status, 401)

    const login = await chamar('/cidadao/login', {
      metodo: 'POST',
      corpo: { email: CADASTRO.email, senha: CADASTRO.senha },
    })
    assert.equal(login.status, 401)

    const salvo = readFileSync(arquivoDados, 'utf8')
    assert.equal(salvo.includes(CADASTRO.email), false)
    assert.equal(salvo.includes(CADASTRO.telefone), false)
    assert.equal(salvo.includes(CADASTRO.logradouro), false)
  })
})

test('recuperação de senha usa token de uso único e revoga sessões', async (t) => {
  const email = 'recupera.senha@example.invalid'
  const cadastro = await chamar('/cidadao/cadastro', {
    metodo: 'POST',
    corpo: { ...CADASTRO, email },
  })
  assert.equal(cadastro.status, 201)
  const cookie = cookieDaResposta(cadastro)

  await t.test('pedido para e-mail inexistente responde de forma genérica', async () => {
    const resposta = await chamar('/cidadao/senha/solicitar', {
      metodo: 'POST',
      corpo: { email: 'nao.existe@example.invalid' },
    })
    assert.equal(resposta.status, 200)
    assert.equal(resposta.payload.dados.ok, true)
    assert.match(resposta.payload.dados.mensagem, /Se houver uma conta/i)
  })

  await t.test('token inválido é rejeitado', async () => {
    const resposta = await chamar('/cidadao/senha/redefinir', {
      metodo: 'POST',
      corpo: { token: 'x'.repeat(43), novaSenha: 'NovaSenha456' },
    })
    assert.equal(resposta.status, 422)
    assert.ok(resposta.payload.erro.campos.token)
  })

  let token = ''
  await t.test('cria token e envia link por e-mail', async () => {
    const cidadao = repositorioCidadaos.buscarPorEmail(email)
    let link = ''
    const resultado = await servicoRecuperacao.criarTokenRecuperacao(cidadao, {
      enviar: async (dados) => {
        link = dados.link
        return { enviado: true }
      },
    })
    token = resultado.token
    assert.equal(resultado.enviado, true)
    assert.match(link, /\/redefinir-senha#token=/)
    assert.equal(link.includes(token), true)
  })

  await t.test('redefine a senha, revoga a sessão antiga e invalida o token', async () => {
    const resposta = await chamar('/cidadao/senha/redefinir', {
      metodo: 'POST',
      corpo: { token, novaSenha: 'NovaSenha456' },
    })
    assert.equal(resposta.status, 200)

    const sessaoAntiga = await chamar('/cidadao/perfil', { cookie })
    assert.equal(sessaoAntiga.status, 401)

    const senhaAntiga = await chamar('/cidadao/login', {
      metodo: 'POST',
      corpo: { email, senha: CADASTRO.senha },
    })
    assert.equal(senhaAntiga.status, 401)

    const senhaNova = await chamar('/cidadao/login', {
      metodo: 'POST',
      corpo: { email, senha: 'NovaSenha456' },
    })
    assert.equal(senhaNova.status, 200)

    const repetido = await chamar('/cidadao/senha/redefinir', {
      metodo: 'POST',
      corpo: { token, novaSenha: 'OutraSenha789' },
    })
    assert.equal(repetido.status, 422)
  })
})
