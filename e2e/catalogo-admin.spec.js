import { expect, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test('administrador edita secretaria, setor e serviço no catálogo', async ({ page }) => {
  await page.goto('/gestao')

  await page.locator('#email-gestao').fill('admin@prefeitura.demo')
  await page.locator('#senha-gestao').fill('prefeitura-demo')
  await page.getByRole('button', { name: 'Entrar no painel' }).click()

  await page.getByRole('link', { name: 'Configurações' }).click()
  await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()

  await page.getByRole('tab', { name: /Catálogo de atendimento/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Catálogo de secretarias, setores e serviços' }),
  ).toBeVisible()
  await expect(page.getByText('Memória', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Nova secretaria' }).click()
  await page.locator('#catalogo-sigla').fill('SEMTUR')
  await page.locator('#catalogo-nome').fill('Secretaria de Turismo')
  await page.locator('#catalogo-slug').fill('secretaria-de-turismo')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText(/Catálogo atualizado/)).toBeVisible()
  await expect(
    page.locator('.config-catalogo__lista').getByText('SEMTUR · Secretaria de Turismo'),
  ).toBeVisible()

  const abasCatalogo = page.locator('.config-catalogo__abas')
  await abasCatalogo.getByRole('tab', { name: 'Setores', exact: true }).click()
  await page.getByRole('button', { name: 'Novo setor' }).click()
  await page.locator('#catalogo-setor-nome').fill('Turismo e Eventos')
  await page.locator('#catalogo-setor-secretaria').selectOption('semtur')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(
    page.locator('.config-catalogo__lista').getByText('Turismo e Eventos', { exact: true }),
  ).toBeVisible()

  await abasCatalogo.getByRole('tab', { name: 'Serviços', exact: true }).click()
  await page.getByRole('button', { name: 'Novo serviço' }).click()
  await page.locator('#catalogo-servico-titulo').fill('Informações turísticas')
  await page.locator('#catalogo-servico-setor').selectOption('turismo_e_eventos')
  await page.locator('#catalogo-servico-categoria').fill('Turismo')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(
    page.locator('.config-catalogo__lista').getByText('Informações turísticas', { exact: true }),
  ).toBeVisible()

  await abasCatalogo.getByRole('tab', { name: 'Setores', exact: true }).click()
  const linhaSetor = page.locator('.config-catalogo__item', { hasText: 'Turismo e Eventos' })
  await linhaSetor.getByRole('button', { name: 'Desativar' }).click()
  await expect(page.getByText(/serviços ativos antes de desativar/)).toBeVisible()

  const resposta = await page.request.get('/api/gestao/catalogo')
  expect(resposta.status()).toBe(200)
  const catalogo = (await resposta.json()).dados
  expect(catalogo.persistencia).toBe('memoria')
  expect(catalogo.secretarias.some((secretaria) => secretaria.id === 'semtur')).toBe(true)
  expect(catalogo.setores.find((setor) => setor.id === 'turismo_e_eventos')?.servicos).toEqual([
    'informacoes_turisticas',
  ])
  expect(
    catalogo.auditoria.some(
      (item) => item.entidade === 'servico' && item.acao === 'criado',
    ),
  ).toBe(true)
})
