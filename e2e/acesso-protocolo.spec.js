import { expect, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test('cria pedido, permite consultar pelo protocolo e imprime', async ({ page, browser }) => {
  await page.goto('/nova-solicitacao')

  await expect(page.getByRole('heading', { name: 'O que aconteceu?' })).toBeVisible()
  await page.locator('.escolha-servico', { hasText: 'Iluminação pública' }).click()
  await expect(page.locator('input[name="tipo"][value="iluminacao"]')).toBeChecked()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Pular por enquanto' }).click()

  await page.locator('#descricao').fill(
    'Poste apagado em frente ao número 123, próximo à praça do bairro.',
  )
  await page.locator('#endereco').fill('Rua do Teste E2E, 123 - Centro')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByRole('button', { name: 'Enviar solicitação' }).click()

  await expect(page.getByRole('heading', { name: 'Pronto!' })).toBeVisible()
  const protocolo = (await page.locator('.protocolo-caixa code').first().textContent()).trim()
  const codigo = (await page.locator('.protocolo-caixa--codigo code').textContent()).trim()

  expect(protocolo).toMatch(/^PREF-\d{4}-\d{6}$/)
  expect(codigo).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  expect(page.url()).not.toContain(codigo)
  expect(page.url()).not.toContain(codigo.replaceAll('-', ''))
  await expect(page.getByText(/não pode ser recuperado/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Imprimir ou salvar PDF' })).toBeVisible()

  await page.locator('.cartao--confirmacao').getByRole('link', { name: 'Acompanhar' }).click()
  await expect(page).toHaveURL(
    new RegExp(`/acompanhar\\?protocolo=${protocolo.replaceAll('-', '\\-')}`),
  )
  await expect(page.locator('#titulo-resultado')).toHaveText(protocolo)
  await expect(page.locator('.resultado .badge').first()).toHaveText('Recebida')
  await expect(page.locator('#codigo-acesso')).toHaveCount(0)

  const pedidosSalvos = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('prefeitura:pedidos') ?? '[]'),
  )
  expect(pedidosSalvos[0]?.codigoAcesso).toBe(codigo)

  const semCodigo = await page.request.get(`/api/solicitacoes/${protocolo}`)
  expect(semCodigo.status()).toBe(200)
  const corpo = await semCodigo.json()
  expect(corpo.dados.protocolo).toBe(protocolo)
  expect(JSON.stringify(corpo)).not.toContain(codigo)
  expect(corpo.dados.codigoAcessoHash).toBeUndefined()

  const contextoLimpo = await browser.newContext()
  const paginaLimpa = await contextoLimpo.newPage()
  const requisicoes = []

  paginaLimpa.on('request', (requisicao) => {
    if (requisicao.url().includes('/api/solicitacoes/')) {
      requisicoes.push({
        url: requisicao.url(),
        cabecalho: requisicao.headers()['x-codigo-acesso'],
      })
    }
  })

  try {
    await paginaLimpa.goto(`/acompanhar?protocolo=${protocolo}`)
    await expect(paginaLimpa.locator('#titulo-resultado')).toHaveText(protocolo)
    await expect(paginaLimpa.locator('#codigo-acesso')).toHaveCount(0)
    expect(paginaLimpa.url()).not.toContain(codigo)

    await paginaLimpa.locator('#protocolo').fill('PREF-2026-999999')
    await paginaLimpa.getByRole('button', { name: 'Buscar', exact: true }).click()
    await expect(
      paginaLimpa.getByRole('heading', { name: 'Protocolo não encontrado' }),
    ).toBeVisible()

    expect(requisicoes.length).toBeGreaterThan(0)
    for (const requisicao of requisicoes) {
      expect(requisicao.url).not.toContain(codigo)
      expect(requisicao.cabecalho).toBeUndefined()
    }

    await paginaLimpa.goto('/servicos')
    await expect(
      paginaLimpa.getByRole('heading', { name: 'Todos os serviços' }),
    ).toBeVisible()
    await paginaLimpa.evaluate(async () => {
      if ('serviceWorker' in navigator) await navigator.serviceWorker.ready
    })
    await paginaLimpa.reload()
    await expect(
      paginaLimpa.getByRole('heading', { name: 'Todos os serviços' }),
    ).toBeVisible()
    await expect
      .poll(() =>
        paginaLimpa.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      )
      .toBe(true)
    await expect
      .poll(() =>
        paginaLimpa.evaluate(async () => (await caches.keys()).includes('api-public-v3')),
      )
      .toBe(true)

    const urlsEmCache = await paginaLimpa.evaluate(async () => {
      const urls = []
      for (const nome of await caches.keys()) {
        const cache = await caches.open(nome)
        for (const requisicao of await cache.keys()) urls.push(requisicao.url)
      }
      return urls
    })
    expect(urlsEmCache.filter((url) => url.includes('/api/solicitacoes'))).toHaveLength(0)
  } finally {
    await contextoLimpo.close()
  }
})
