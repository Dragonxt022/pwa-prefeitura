import { expect, test } from '@playwright/test'

test('nova solicitação oferece conta opcional e preenche os dados após o cadastro', async ({
  page,
}) => {
  const email = `conta-solicitacao-${Date.now()}@example.invalid`

  await page.goto('/nova-solicitacao')
  await page.locator('.escolha-servico', { hasText: 'Iluminação pública' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('heading', { name: 'Sua conta no atendimento' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pular por enquanto' })).toBeVisible()

  await page.getByRole('tab', { name: 'Criar conta' }).click()
  await page.locator('#perfil-nome').fill('Ana Teste da Conta')
  await page.locator('#perfil-email').fill(email)
  await page.locator('#perfil-senha').fill('SenhaForte123')
  await page.locator('#perfil-telefone').fill('69999997777')
  await page.locator('#perfil-cep').fill('76800000')
  await page.locator('#perfil-logradouro').fill('Rua da Conta')
  await page.locator('#perfil-numero').fill('45')
  await page.locator('#perfil-bairro').fill('Centro')
  await page.locator('#perfil-cidade').fill('Cujubim')
  await page.locator('#perfil-uf').fill('RO')

  const formularioConta = page.locator('.perfil-formulario')
  await formularioConta.getByRole('checkbox').check()
  await formularioConta.getByRole('button', { name: 'Criar minha conta' }).click()

  await expect(page.getByText(/Você está conectado/i)).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.locator('#descricao')).toBeVisible()
  await expect(page.locator('#endereco')).toHaveValue('Rua da Conta, 45 - Centro')
  await expect(page.locator('#cep')).toHaveValue('76800-000')
})
