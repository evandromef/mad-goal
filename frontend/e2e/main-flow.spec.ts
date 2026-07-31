import { expect, test } from '@playwright/test';

test('cadastro confirmado, carteira, lançamento e detalhe com nota', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /cadastre-se/i }).click();
  await page.getByLabel('Nome').fill('Pessoa E2E');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha-segura');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Confirme seu e-mail' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar e entrar' }).click();

  await page.getByRole('button', { name: 'Criar carteira' }).click();
  await page.getByPlaceholder('Nome da nova carteira').fill('Carteira E2E');
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  const form = page.locator('form.stack-form');
  const purchaseHeight = (await form.boundingBox())!.height;
  for (const type of ['DIVIDENDO', 'JCP', 'BONIFICACAO', 'DESDOBRAMENTO']) {
    await form.getByLabel('Tipo').selectOption(type);
    expect((await form.boundingBox())!.height).toBe(purchaseHeight);
    if (type === 'JCP') {
      const dateBox = (await form.getByLabel('Data').boundingBox())!;
      const unitPriceBox = (await form.getByLabel('Preço unitário (opcional)').boundingBox())!;
      const descriptionBox = (await form.getByLabel('Descrição (opcional)').boundingBox())!;
      expect(unitPriceBox.y - (dateBox.y + dateBox.height)).toBeLessThan(56);
      expect(descriptionBox.y).toBeGreaterThan(unitPriceBox.y + unitPriceBox.height);
      expect(descriptionBox.y - (unitPriceBox.y + unitPriceBox.height)).toBeLessThan(56);
    }
  }
  await form.getByLabel('Tipo').selectOption('COMPRA');
  const petr4 = await page.locator('select[formcontrolname="assetId"] option', { hasText: /^PETR4 ·/ })
    .getAttribute('value');
  await page.getByLabel('Ativo').selectOption(petr4!);
  await page.getByLabel('Quantidade').fill('10.12345678');
  await page.getByLabel('Valor total').fill('1000.12345678');
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByRole('status')).toContainText('sucesso');
  await form.getByLabel('Tipo').selectOption('VENDA');
  await form.getByLabel('Ativo').selectOption(petr4!);
  await form.getByLabel('Quantidade').fill('999999');
  await form.getByLabel('Valor total').fill('1');
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(form.locator('.form-message-slot .alert')).toBeVisible();
  expect((await form.boundingBox())!.height).toBe(purchaseHeight);
  await page.getByRole('link', { name: 'PETR4' }).click();
  await expect(page.getByRole('heading', { name: 'PETR4' })).toBeVisible();
  await page.getByLabel('Conteúdo').fill('Nota criada no fluxo E2E');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await expect(page.getByText('Nota criada no fluxo E2E')).toBeVisible();
});
