import { expect, test } from '@playwright/test'

test('cidadão cria conta e tem contato e endereço preenchidos na solicitação', async ({ page }) => {
  const email = `perfil-${Date.now()}@example.invalid`

  await page.goto('/perfil')
  await page.getByRole('tab', { name: 'Criar conta' }).click()

  await page.locator('#perfil-nome').fill('Maria Teste da Silva')
  await page.locator('#perfil-email').fill(email)
  await page.locator('#perfil-senha').fill('SenhaForte123')
  await page.locator('#perfil-telefone').fill('69999998888')
  await page.locator('#perfil-cep').fill('76800000')
  await page.locator('#perfil-logradouro').fill('Rua das Acácias')
  await page.locator('#perfil-numero').fill('120')
  await page.locator('#perfil-bairro').fill('Centro')
  await page.locator('#perfil-cidade').fill('Cujubim')
  await page.locator('#perfil-uf').fill('RO')

  const formulario = page.locator('.perfil-formulario')
  await formulario.getByRole('checkbox').check()
  await formulario.getByRole('button', { name: 'Criar minha conta' }).click()

  await expect(page.getByRole('heading', { name: 'Maria Teste da Silva' })).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
  await expect(page.getByText(/Rua das Acácias, 120/)).toBeVisible()

  await page.goto('/nova-solicitacao')
  await expect(page.locator('#endereco')).toHaveValue('Rua das Acácias, 120 - Centro')
  await expect(page.locator('#contato')).toHaveValue('(69) 99999-8888')
  await expect(page.locator('#cep')).toHaveValue('76800-000')
  await expect(page.getByText(/preenchidos a partir do seu cadastro/i)).toBeVisible()

  await page.goto('/perfil')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('tab', { name: 'Entrar' })).toBeVisible()

  await page.locator('#conta-email').fill(email)
  await page.locator('#conta-senha').fill('SenhaForte123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Maria Teste da Silva' })).toBeVisible()
})
