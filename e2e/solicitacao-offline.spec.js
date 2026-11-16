import { expect, test } from '@playwright/test'

// O Service Worker poderia responder do cache e mascarar as falhas simuladas.
test.use({ serviceWorkers: 'block' })

const SERVICO = 'Iluminação pública'
const DESCRICAO = 'Lâmpada apagada no teste de envio sem conexão com o servidor.'
const ENDERECO = 'Rua das Acácias, 120 - Centro'

function erro502(route) {
  return route.fulfill({
    status: 502,
    contentType: 'application/json',
    body: JSON.stringify({
      erro: { codigo: 'erro_interno', mensagem: 'Serviço temporariamente indisponível.' },
    }),
  })
}

async function preencherAteRevisao(page) {
  await page.locator('.escolha-servico', { hasText: SERVICO }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Pular por enquanto' }).click()
  await page.locator('#descricao').fill(DESCRICAO)
  await page.locator('#endereco').fill(ENDERECO)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Revise antes de enviar' })).toBeVisible()
}

async function lerFila(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('prefeitura:fila') ?? '[]'))
}

test('envio com 502 fica na fila e é concluído quando o servidor volta', async ({ page }) => {
  await page.goto('/nova-solicitacao')
  await preencherAteRevisao(page)

  await page.route('**/api/solicitacoes', (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    return erro502(route)
  })

  await page.getByRole('button', { name: 'Enviar solicitação' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido salvo' })).toBeVisible()

  const fila = await lerFila(page)
  expect(fila).toHaveLength(1)
  expect(fila[0].payload.descricao).toBe(DESCRICAO)
  expect(fila[0].payload.clientId).toBeTruthy()

  await page.unroute('**/api/solicitacoes')

  // Recarregar reinicia o layout, que tenta enviar a fila ao montar.
  await page.goto('/acompanhar')
  await expect
    .poll(async () => (await lerFila(page)).length, { timeout: 20_000 })
    .toBe(0)

  const protocolo = await page.evaluate(
    () => JSON.parse(localStorage.getItem('prefeitura:fila-enviada') ?? 'null')?.protocolo,
  )
  expect(protocolo).toBeTruthy()
  await expect(page.locator('.pedido-card code', { hasText: protocolo }).first()).toBeVisible()
})

test('catálogo salvo mantém o formulário quando a API de serviços falha', async ({
  page,
  context,
}) => {
  await page.goto('/nova-solicitacao')
  await expect(page.locator('.escolha-servico').first()).toBeVisible()

  await page.route('**/api/servicos', erro502)
  await page.reload()
  await expect(page.locator('.escolha-servico').first()).toBeVisible()
  await expect(page.locator('.escolha-servico', { hasText: SERVICO })).toBeVisible()

  // Sem rede, o envio nem chega a chamar a API: vai direto para a fila.
  await context.setOffline(true)
  await preencherAteRevisao(page)
  await page.getByRole('button', { name: 'Salvar no aparelho' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido salvo' })).toBeVisible()

  const fila = await lerFila(page)
  expect(fila).toHaveLength(1)
  expect(fila[0].payload.endereco).toBe(ENDERECO)
})
