import { expect, test } from '@playwright/test';

test('cadastro confirmado, carteira, lançamento e detalhe com nota', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto('/login?mode=reset&token=token-do-link', { waitUntil: 'domcontentloaded' });
  const themeToggle = page.getByRole('button', { name: 'Ativar tema claro' });
  await expect(themeToggle).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'orbital');
  const orbitalBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic');
  await expect.poll(() => page.locator('body')
    .evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(orbitalBackground);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic');
  await page.getByRole('button', { name: 'Ativar tema orbital' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'orbital');
  await expect(page.getByRole('heading', { name: 'Redefinir senha' })).toBeVisible();
  await expect(page.getByLabel('Token')).toHaveValue('token-do-link');
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /cadastre-se/i }).click();
  await page.getByLabel('Nome').fill('Pessoa E2E');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha-segura');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Confirme seu e-mail' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar e entrar' }).click();

  await page.getByRole('link', { name: 'Perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar', exact: true }).click();

  await page.getByRole('button', { name: 'Criar carteira' }).click();
  await expect(page.locator('.inline-form').getByRole('button', { name: 'Cancelar' })).toBeVisible();
  await page.getByPlaceholder('Nome da nova carteira').fill('Carteira E2E');
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  const walletActions = page.getByRole('button', { name: 'Ações da carteira' });
  await walletActions.click();
  const walletActionGroup = page.getByRole('group', { name: 'Ações da carteira' });
  const walletActionElement = page.locator('#wallet-actions-menu');
  const walletMenuAnimation = await walletActionGroup.evaluate(element => getComputedStyle(element).animationName);
  expect(walletMenuAnimation).toContain('motion-menu-in');
  await expect(walletActionGroup.getByRole('button')).toHaveCount(3);
  await page.keyboard.press('Escape');
  const leavingMenuState = await walletActionElement.evaluate(element => ({
    inert: (element as HTMLElement).inert,
    ariaHidden: element.getAttribute('aria-hidden')
  }));
  expect(leavingMenuState).toEqual({ inert: true, ariaHidden: 'true' });
  await expect(walletActionGroup).toHaveCount(0);
  await expect(walletActions).toBeFocused();
  await expect(walletActionElement).toHaveCount(0);
  await walletActions.click();
  await walletActionGroup.getByRole('button', { name: 'Nova carteira' }).click();
  const newWalletModal = page.getByRole('dialog');
  await expect(newWalletModal.getByRole('heading', { name: 'Nova carteira' })).toBeVisible();
  await expect(newWalletModal.getByLabel('Nome da carteira')).toBeVisible();
  await newWalletModal.getByRole('button', { name: 'Cancelar' }).click();
  await expect(walletActions).toBeFocused();
  const newRecordButton = page.getByRole('button', { name: 'Novo lançamento' });
  await expect(newRecordButton).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 900 });
  await newRecordButton.click();
  const recordModal = page.getByRole('dialog');
  await expect(recordModal.locator('.modal-mark')).toBeVisible();
  const regularModalOverflow = await recordModal.evaluate(element => ({
    horizontal: element.scrollWidth > element.clientWidth,
    vertical: element.scrollHeight > element.clientHeight
  }));
  expect(regularModalOverflow).toEqual({ horizontal: false, vertical: false });
  const modalAnimation = await recordModal.evaluate(element => getComputedStyle(element).animationName);
  expect(modalAnimation).toContain('motion-dialog-in');
  const modalDurations = await recordModal.evaluate(element => {
    const milliseconds = (duration: string): number => duration.endsWith('ms')
      ? Number.parseFloat(duration)
      : Number.parseFloat(duration) * 1000;
    return {
      dialog: milliseconds(getComputedStyle(element).animationDuration),
      backdrop: milliseconds(getComputedStyle(element.parentElement!).animationDuration)
    };
  });
  expect(modalDurations.backdrop).toBeGreaterThanOrEqual(modalDurations.dialog);
  await expect(recordModal.getByRole('heading', { name: 'Novo lançamento' })).toBeVisible();
  await recordModal.evaluate(async element => {
    await Promise.allSettled(element.getAnimations().map(animation => animation.finished));
  });
  await page.setViewportSize({ width: 768, height: 600 });
  await expect(recordModal.locator('.modal-mark')).toBeVisible();
  const shortViewportModalBounds = (await recordModal.boundingBox())!;
  expect(shortViewportModalBounds.y).toBeGreaterThanOrEqual(0);
  expect(shortViewportModalBounds.y + shortViewportModalBounds.height).toBeLessThanOrEqual(600);
  const shortViewportModalOverflow = await recordModal.evaluate(element => ({
    horizontal: element.scrollWidth > element.clientWidth,
    vertical: element.scrollHeight > element.clientHeight
  }));
  expect(shortViewportModalOverflow).toEqual({ horizontal: false, vertical: false });
  const form = page.locator('form.stack-form');
  const valuesSlot = form.locator('.record-values-slot');
  const purchaseHeight = (await form.boundingBox())!.height;
  await form.getByLabel('Tipo').selectOption('DIVIDENDO');
  const enteringValues = valuesSlot.locator('.motion-field-enter');
  await expect(enteringValues).toHaveCount(1);
  expect(await enteringValues.evaluate(element => getComputedStyle(element).animationName)).toContain('motion-field-in');
  const leavingValues = valuesSlot.locator('.motion-field-leave');
  await expect(leavingValues).toHaveAttribute('aria-hidden', 'true');
  await valuesSlot.evaluate(async element => {
    await Promise.allSettled(element.getAnimations({ subtree: true }).map(animation => animation.finished));
  });
  expect((await form.boundingBox())!.height).toBe(purchaseHeight);
  for (const type of ['JCP', 'BONIFICACAO', 'DESDOBRAMENTO']) {
    await form.getByLabel('Tipo').selectOption(type);
    await form.evaluate(async element => {
      await Promise.allSettled(element.getAnimations({ subtree: true }).map(animation => animation.finished));
    });
    expect((await form.boundingBox())!.height).toBe(purchaseHeight);
    if (type === 'JCP') {
      await expect(form.locator('.record-unit-price')).toContainText('Valor por cota/ação');
      const incomeUnitBox = (await form.locator('.record-unit-price').boundingBox())!;
      const incomeDateBox = (await form.locator('input[formControlName="date"]').boundingBox())!;
      expect(Math.abs(incomeUnitBox.x - incomeDateBox.x)).toBeLessThan(2);
    }
  }
  await form.getByLabel('Tipo').selectOption('COMPRA');
  await form.evaluate(async element => {
    await Promise.allSettled(element.getAnimations({ subtree: true }).map(animation => animation.finished));
  });
  const firstRow = form.locator('.record-main-row');
  const valuesRow = valuesSlot.locator(':scope > .record-values-row');
  const dateTotalRow = form.locator('.record-date-total-row');
  const firstRowBoxes = await firstRow.locator(':scope > label > select, .record-asset-slot > label > input')
    .evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
  expect(firstRowBoxes).toHaveLength(2);
  expect(Math.max(...firstRowBoxes.map(box => box.y)) - Math.min(...firstRowBoxes.map(box => box.y))).toBeLessThan(2);
  expect(firstRowBoxes[1].width).toBeGreaterThan(firstRowBoxes[0].width * 1.9);
  const secondRowBoxes = await valuesRow.locator(':scope > label > input')
    .evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
  expect(secondRowBoxes).toHaveLength(3);
  expect(Math.max(...secondRowBoxes.map(box => box.y)) - Math.min(...secondRowBoxes.map(box => box.y))).toBeLessThan(2);
  const dateBox = (await dateTotalRow.locator('input[formControlName="date"]').boundingBox())!;
  const totalValueBox = (await dateTotalRow.locator('.total-value').boundingBox())!;
  const totalValueInputBox = (await dateTotalRow.locator('input[formControlName="totalValue"]').boundingBox())!;
  const descriptionBox = (await form.locator('.record-description').boundingBox())!;
  expect(totalValueInputBox.y).toBeGreaterThan(secondRowBoxes[0].y + secondRowBoxes[0].height);
  expect(Math.abs(totalValueInputBox.y - dateBox.y)).toBeLessThan(2);
  expect(totalValueInputBox.x).toBeGreaterThan(dateBox.x + dateBox.width);
  expect(descriptionBox.y).toBeGreaterThan(totalValueInputBox.y + totalValueInputBox.height);
  expect(descriptionBox.width).toBeGreaterThan(totalValueBox.width * 2.8);
  await form.getByLabel('Ativo').fill('PETR4');
  await page.getByLabel('Quantidade').fill('10.12345678');
  await page.getByLabel('Valor total').fill('1000.12345678');
  await page.getByLabel('Preço unitário (opcional)').fill('98.79');
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByRole('status')).toContainText('sucesso');
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.locator('.activity-icon').first()).toHaveText('C');
  await expect(page.locator('.activity-value').first())
    .toContainText('10,12345678 un. · Preço unitário R$ 98,79');
  await expect(page.locator('.metric').filter({ hasText: 'Custo de aquisição' }).locator('strong'))
    .toHaveText(/R\$\s*1\.000,12/);
  await page.getByRole('link', { name: 'Posições da carteira', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Posições da carteira' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible();
  await expect(page.locator('app-record-form')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('PETR4');
  const positionCategoryFilter = page.getByLabel('Tipo de ativo');
  await expect(positionCategoryFilter.locator('option')).toHaveText(['Todos', 'Ações', 'FIIs']);
  await positionCategoryFilter.selectOption('FII');
  await expect(page.getByText('Nenhuma posição encontrada para o tipo selecionado.')).toBeVisible();
  await expect(page.locator('main .chip')).toContainText('0 de 1 ativos');
  await positionCategoryFilter.selectOption('ACAO');
  await expect(page.locator('tbody')).toContainText('PETR4');
  await expect(page.locator('main .chip')).toContainText('1 de 1 ativos');
  await positionCategoryFilter.selectOption('TODOS');
  await page.getByRole('link', { name: 'Voltar à carteira' }).click();
  await page.locator('.topbar-menu').getByRole('link', { name: 'Proventos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Proventos' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible();
  const incomeRecordForm = page.locator('app-record-form');
  await expect(incomeRecordForm.getByLabel('Tipo').locator('option')).toHaveCount(2);
  const incomeAsset = incomeRecordForm.getByLabel('Ativo');
  const incomeAssetId = await incomeAsset.locator('option', { hasText: /^PETR4 ·/ }).getAttribute('value');
  await incomeAsset.selectOption(incomeAssetId!);
  await incomeRecordForm.getByLabel('Valor total').fill('10');
  await incomeRecordForm.getByLabel('Preço unitário (opcional)').fill('1');
  await incomeRecordForm.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(incomeRecordForm.getByRole('status')).toContainText('sucesso');
  await expect(page.locator('.income-page-history tbody')).toContainText('PETR4');
  await page.getByRole('link', { name: 'Posições', exact: true }).click();
  const petr4Position = page.locator('tbody tr').filter({ hasText: 'PETR4' });
  await expect(petr4Position.locator('.position-income')).toContainText(/R\$\s*10,00/);
  await page.getByRole('link', { name: 'Voltar à carteira' }).click();
  const positionsPanel = (await page.locator('#posicoes > article').boundingBox())!;
  const distributionPanel = (await page.locator('#posicoes > aside').boundingBox())!;
  expect(distributionPanel.width).toBeLessThan(positionsPanel.width / 3);
  const insightPanels = page.locator('.dashboard-insights-grid > article');
  await expect(insightPanels).toHaveCount(3);
  const incomePanel = insightPanels.nth(2);
  const incomeMonths = incomePanel.locator('.income-selected-month');
  await expect(incomeMonths).toHaveCount(12);
  await expect(incomeMonths.first()).toHaveAttribute('aria-expanded', 'true');
  await expect(incomePanel.locator('.income-month-details.open')).toHaveCount(1);
  await expect(incomePanel.getByText('Total filtrado')).toHaveCount(0);
  await expect(incomePanel.locator('form')).toHaveCount(0);
  await expect(incomePanel.locator('thead')).toContainText('Ativo');
  await expect(incomePanel.locator('thead')).toContainText('Pagamento');
  await expect(incomePanel.locator('tbody')).toContainText('PETR4');
  await incomeMonths.nth(1).click();
  const incomeAnimation = await incomePanel.locator('.income-month-details').nth(1)
    .locator('.income-month-content-shell').evaluate(element => getComputedStyle(element).animationName);
  expect(incomeAnimation).toContain('motion-expand-in');
  await expect(incomeMonths.first()).toHaveAttribute('aria-expanded', 'false');
  await expect(incomeMonths.nth(1)).toHaveAttribute('aria-expanded', 'true');
  await expect(incomePanel.getByText('Nenhum provento recebido neste mês.')).toBeVisible();
  await incomeMonths.first().click();
  await expect(incomePanel.locator('tbody')).toContainText('PETR4');
  const insightBoxes = await insightPanels.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y };
  }));
  expect(insightBoxes[0].x).toBeLessThan(insightBoxes[1].x);
  expect(insightBoxes[1].x).toBeLessThan(insightBoxes[2].x);
  expect(Math.abs(insightBoxes[0].y - insightBoxes[2].y)).toBeLessThan(2);
  await expect.poll(() => page.locator('.activity-list').evaluate(element => getComputedStyle(element).overflowY))
    .toBe('visible');
  await expect.poll(() => page.locator('.evolution').evaluate(element => getComputedStyle(element).overflowY))
    .toBe('visible');
  expect((await page.locator('.activity').first().boundingBox())!.height).toBeLessThan(90);
  const recordsPanel = page.locator('#lancamentos .records-panel');
  await expect(recordsPanel.getByRole('link', { name: 'Lançamentos', exact: true }))
    .toHaveAttribute('href', /\/wallets\/[^/]+\/records/);
  await recordsPanel.getByRole('link', { name: /Ver histórico completo/ }).click();
  await expect(page.getByRole('heading', { name: 'Histórico de lançamentos' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible();
  await expect(page.locator('.topbar-menu').getByRole('link')).toHaveCount(4);
  const recordFormPanel = (await page.locator('#novo-lancamento').boundingBox())!;
  const recordsFilterPanel = (await page.locator('.records-filters').boundingBox())!;
  expect(recordFormPanel.x).toBeLessThan(recordsFilterPanel.x);
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('tbody')).toContainText('PETR4');
  const recordsFilters = page.locator('.records-filter');
  await recordsFilters.getByLabel('Tipo').selectOption('VENDA');
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  await expect(page.getByText('Nenhum lançamento encontrado para os filtros selecionados.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('link', { name: 'Novo lançamento' }).click();
  await expect(page.getByRole('heading', { name: 'Adicionar lançamento' })).toBeVisible();
  await expect(page.locator('app-record-form')).toBeVisible();
  await page.getByRole('link', { name: 'Voltar à carteira' }).click();
  await expect(page.locator('#lancamentos').getByRole('heading', { name: 'Lançamentos' })).toBeVisible();
  const editTrigger = page.locator('.activity').filter({ hasText: 'Compra · PETR4' })
    .getByRole('button', { name: 'Editar lançamento' });
  await editTrigger.click();
  const editModal = page.getByRole('dialog');
  await expect(editModal.getByRole('heading', { name: 'Editar lançamento' })).toBeVisible();
  await editModal.getByRole('button', { name: 'Cancelar' }).click();
  await expect(editTrigger).toBeFocused();
  const deleteTrigger = page.locator('.activity').filter({ hasText: 'Compra · PETR4' })
    .getByRole('button', { name: 'Excluir lançamento' });
  await deleteTrigger.focus();
  await page.keyboard.press('Enter');
  const deleteModal = page.getByRole('dialog');
  await expect(deleteModal).toBeVisible();
  await expect(deleteModal.getByRole('heading', { name: 'Excluir lançamento?' })).toBeVisible();
  await expect(deleteModal).toContainText('PETR4');
  const cancelDeletion = deleteModal.getByRole('button', { name: 'Manter lançamento' });
  const confirmDeletion = deleteModal.getByRole('button', { name: 'Excluir lançamento' });
  await expect(cancelDeletion).toBeFocused();
  await confirmDeletion.focus();
  await page.keyboard.press('Tab');
  await expect(cancelDeletion).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirmDeletion).toBeFocused();
  await cancelDeletion.click();
  await expect(deleteModal).not.toBeVisible();
  await expect(deleteTrigger).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await walletActions.click();
  await expect(walletActionGroup).toBeVisible();
  const reducedDuration = await walletActionGroup.evaluate(element => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(reducedDuration)).toBeLessThanOrEqual(0.001);
  await page.keyboard.press('Escape');
  await expect(walletActions).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await newRecordButton.click();
  await expect(recordModal.getByRole('heading', { name: 'Novo lançamento' })).toBeVisible();
  await form.getByLabel('Tipo').selectOption('VENDA');
  await form.locator('.record-asset-slot').evaluate(async element => {
    await Promise.allSettled(element.getAnimations({ subtree: true }).map(animation => animation.finished));
  });
  const petr4 = await form.locator('select[formcontrolname="assetId"] option', { hasText: /^PETR4 ·/ })
    .getAttribute('value');
  await form.getByLabel('Ativo').selectOption(petr4!);
  await form.getByLabel('Quantidade').fill('999999');
  await form.getByLabel('Valor total').fill('1');
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(form.locator('.form-message-slot .alert')).toBeVisible();
  expect((await form.boundingBox())!.height).toBe(purchaseHeight);
  await recordModal.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByRole('link', { name: 'PETR4' }).click();
  await expect(page.getByRole('heading', { name: 'PETR4' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible();
  await page.getByLabel('Conteúdo').fill('Nota criada no fluxo E2E');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await expect(page.getByText('Nota criada no fluxo E2E')).toBeVisible();

  await page.route('**/api/wallets', route => route.fulfill({ status: 401, body: '' }));
  await page.route('**/api/auth/refresh', route => route.fulfill({ status: 401, body: '' }));
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('mad_token'))).toBeNull();
});
