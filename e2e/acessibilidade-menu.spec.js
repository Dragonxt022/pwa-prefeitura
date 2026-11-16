import { expect, test } from '@playwright/test'

test('menu flutuante alterna tema, texto ampliado e mantém as preferências', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.aviso-notificacoes')).toContainText(
    /Ative as notificações|Notificações bloqueadas/,
  )

  await page.getByRole('button', { name: 'Abrir menu de acessibilidade' }).click()
  await expect(page.getByRole('dialog', { name: 'Opções de acessibilidade' })).toBeVisible()

  const corClara = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  await page.getByRole('button', { name: /Modo escuro/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'escuro')
  const corEscura = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(corEscura).not.toBe(corClara)

  await page.getByRole('button', { name: /Modo claro/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro')

  await page.getByRole('button', { name: /Texto ampliado/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-fonte', 'grande')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro')
  await expect(page.locator('html')).toHaveAttribute('data-fonte', 'grande')
})
