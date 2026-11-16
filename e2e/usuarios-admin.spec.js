import { expect, test } from '@playwright/test'

test('administrador cria e edita um usuário pelo painel', async ({ page }) => {
  const emailInicial = 'usuario.e2e@prefeitura.demo'
  const emailEditado = 'usuario.e2e.editado@prefeitura.demo'

  await page.goto('/gestao')
  await page.locator('#email-gestao').fill('admin@prefeitura.demo')
  await page.locator('#senha-gestao').fill('prefeitura-demo')
  await page.getByRole('button', { name: 'Entrar no painel' }).click()

  await page.getByRole('tab', { name: 'Usuários' }).click()
  await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible()

  await page.getByRole('button', { name: 'Novo usuário' }).click()
  await page.locator('#usuario-nome').fill('Usuário Teste E2E')
  await page.locator('#usuario-email').fill(emailInicial)
  await page.locator('#usuario-senha').fill('senha-inicial-1')
  await page.getByRole('button', { name: 'Criar usuário' }).click()
  await expect(page.getByText(/Usuário criado/)).toBeVisible()

  const linhasComEmailInicial = page.locator('.gestao-usuario-item', { hasText: emailInicial })
  await expect(linhasComEmailInicial).toHaveCount(1)
  await linhasComEmailInicial.getByRole('button', { name: 'Editar Usuário Teste E2E' }).click()

  await expect(page.getByRole('heading', { name: 'Editar usuário' })).toBeVisible()
  await page.locator('#usuario-nome').fill('Usuário Teste Editado')
  await page.locator('#usuario-email').fill(emailEditado)
  await page.locator('#usuario-senha').fill('nova-senha-123')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()

  await expect(page.getByText('Dados do usuário atualizados.')).toBeVisible()
  const linhaEditada = page.locator('.gestao-usuario-item', { hasText: emailEditado })
  await expect(linhaEditada).toContainText('Usuário Teste Editado')
  await expect(page.locator('.gestao-usuario-item', { hasText: emailInicial })).toHaveCount(0)

  const resposta = await page.request.get('/api/gestao/usuarios')
  expect(resposta.status()).toBe(200)
  const { dados } = await resposta.json()
  const usuario = dados.find((item) => item.email === emailEditado)
  expect(usuario?.nome).toBe('Usuário Teste Editado')
  expect(usuario?.ativo).toBe(true)
})
