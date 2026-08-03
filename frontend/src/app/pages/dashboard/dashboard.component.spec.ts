import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService, Dashboard, LedgerItem } from '../../core/api.service';
import { DashboardComponent } from './dashboard.component';
import { SessionService } from '../../core/session.service';
import { ModalService } from '../../core/modal.service';

describe('DashboardComponent - lançamentos', () => {
  const dashboard: Dashboard = {
    acquisitionCost: 0,
    currentValue: 0,
    profitLoss: 0,
    returnPercentage: null,
    totalIncome: 0,
    largestPosition: null,
    categories: [],
    positions: [],
    evolution: []
  };
  const item: LedgerItem = {
    id: 'record-1',
    walletId: 'wallet-1',
    assetId: 'asset-1',
    ticker: 'PETR4',
    type: 'COMPRA',
    date: '2026-07-30',
    quantity: 10,
    unitPrice: 9.5,
    fees: 5,
    totalValue: 1000,
    description: 'Compra inicial'
  };
  const api = {
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
    createRecord: vi.fn(),
    dashboard: vi.fn(),
    records: vi.fn(),
    incomes: vi.fn(),
    assets: vi.fn(),
    wallets: vi.fn(),
    createWallet: vi.fn(),
    updateWallet: vi.fn(),
    deleteWallet: vi.fn()
  };
  const session = { clear: vi.fn() };
  const modal = { confirm: vi.fn(), prompt: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    api.updateRecord.mockReturnValue(of(item));
    api.deleteRecord.mockReturnValue(of(undefined));
    api.dashboard.mockReturnValue(of(dashboard));
    api.records.mockReturnValue(of([]));
    api.incomes.mockReturnValue(of({ total: 0, groups: [], items: [] }));
    api.assets.mockReturnValue(of([]));
    api.wallets.mockReturnValue(of([{ id: 'wallet-1', name: 'Principal', currentValue: 0 }]));
    api.createWallet.mockReturnValue(of({ id: 'wallet-2', name: 'Nova', currentValue: 0 }));
    api.updateWallet.mockReturnValue(of({ id: 'wallet-1', name: 'Renomeada', currentValue: 0 }));
    api.deleteWallet.mockReturnValue(of(undefined));
    api.createRecord.mockReturnValue(of(item));
    modal.confirm.mockResolvedValue(true);
    modal.prompt.mockResolvedValue('Renomeada');
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: SessionService, useValue: session },
        { provide: ModalService, useValue: modal }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('preenche o formulário e atualiza o lançamento existente', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.selectedWalletId.set('wallet-1');

    component.editRecord(item);

    expect(component.editingId()).toBe('record-1');
    expect(component.recordForm.getRawValue()).toMatchObject({
      assetId: 'asset-1',
      type: 'COMPRA',
      quantity: 10,
      unitPrice: 9.5,
      fees: 5,
      totalValue: 1000
    });

    component.recordForm.patchValue({ quantity: 12, totalValue: 1200 });
    vi.useFakeTimers();
    component.saveRecord();

    expect(api.updateRecord).toHaveBeenCalledWith('record-1', expect.objectContaining({
      walletId: 'wallet-1',
      assetId: 'asset-1',
      quantity: 12,
      totalValue: 1200
    }));
    expect(component.editingId()).toBeNull();
    expect(component.successMessage()).toBe('Lançamento atualizado com sucesso.');
    expect(component.message()).toBe('');

    vi.advanceTimersByTime(3500);
    expect(component.successMessage()).toBe('');
    vi.useRealTimers();
  });

  it('exclui após confirmação e recarrega a carteira', async () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.selectedWalletId.set('wallet-1');
    await component.deleteRecord(item);

    expect(api.deleteRecord).toHaveBeenCalledWith('record-1');
    expect(api.dashboard).toHaveBeenCalledWith('wallet-1', 'MONTHLY');
    expect(api.records).toHaveBeenCalledWith('wallet-1');
    expect(component.successMessage()).toBe('Lançamento excluído com sucesso.');
    expect(component.message()).toBe('');
  });

  it('carrega dados, gerencia carteira e alterna análises', async () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.ngOnInit();
    expect(component.selectedWalletId()).toBe('wallet-1');
    expect(api.assets).toHaveBeenCalled();
    expect(api.incomes).toHaveBeenCalled();

    component.walletForm.setValue({ name: 'Nova' });
    component.createWallet();
    expect(api.createWallet).toHaveBeenCalledWith('Nova');

    component.selectedWalletId.set('wallet-1');
    await component.renameWallet();
    expect(api.updateWallet).toHaveBeenCalledWith('wallet-1', 'Renomeada');

    await component.deleteWallet();
    expect(api.deleteWallet).toHaveBeenCalledWith('wallet-1');

    component.selectedWalletId.set('wallet-1');
    component.changeGranularity('YEARLY');
    expect(api.dashboard).toHaveBeenCalledWith('wallet-1', 'YEARLY');
    expect(component.evolutionWidth(10)).toBeGreaterThan(0);
  });

  it('agrupa as ações da carteira em um menu acessível', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.wallet-actions-trigger');

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.wallet-actions-menu')).toBeNull();
    trigger.click();
    fixture.detectChanges();

    const menu: HTMLElement = fixture.nativeElement.querySelector('.wallet-actions-menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(Array.from(menu.querySelectorAll('button')).map(button => button.textContent?.trim()))
      .toEqual(['Nova carteira', 'Renomear carteira', 'Excluir carteira']);

  });

  it('usa formulário cancelável na primeira carteira e modal nas próximas', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.wallets.set([]);

    await component.openWalletCreation();
    fixture.detectChanges();
    component.walletForm.setValue({ name: 'Temporária' });
    fixture.nativeElement.querySelector('.inline-form .button.secondary').click();
    expect(component.showWalletForm()).toBe(false);
    expect(component.walletForm.controls.name.value).toBe('');

    component.wallets.set([{ id: 'wallet-1', name: 'Principal', currentValue: 0 }]);
    modal.prompt.mockResolvedValueOnce('Reserva');
    await component.openWalletCreation();

    expect(modal.prompt).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Nova carteira', inputLabel: 'Nome da carteira', confirmLabel: 'Criar carteira'
    }));
    expect(api.createWallet).toHaveBeenCalledWith('Reserva');
    expect(component.showWalletForm()).toBe(false);
  });

  it('exibe somente os 24 períodos mais recentes da evolução', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    const evolution = Array.from({ length: 30 }, (_, index) => ({
      period: `período-${index + 1}`,
      acquisitionCost: index + 1
    }));
    component.dashboard.set({ ...dashboard, evolution });

    expect(component.visibleEvolution()).toHaveLength(24);
    expect(component.visibleEvolution()[0].period).toBe('período-30');
    expect(component.visibleEvolution()[23].period).toBe('período-7');
    expect(component.evolutionWidth(30)).toBe(100);
  });

  it('exibe os 10 lançamentos mais recentes e links para o histórico completo', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.wallets.set([{ id: 'wallet-1', name: 'Principal', currentValue: 0 }]);
    component.selectedWalletId.set('wallet-1');
    component.dashboard.set(dashboard);
    component.records.set(Array.from({ length: 25 }, (_, index) => ({
      ...item, id: `record-${index}`, date: `2026-07-${String(index + 1).padStart(2, '0')}`
    })));
    fixture.detectChanges();

    expect(component.recentRecords()).toHaveLength(10);
    expect(component.recentRecords()[0].id).toBe('record-24');
    expect(component.recentRecords()[9].id).toBe('record-15');
    expect(fixture.nativeElement.querySelectorAll('.activity-list .activity')).toHaveLength(10);
    expect(fixture.nativeElement.querySelector('.topbar-menu a[href="/wallets/wallet-1/records"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.records-title-link[href="/wallets/wallet-1/records"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.records-link[href="/wallets/wallet-1/records"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/wallets/wallet-1/positions"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/wallets/wallet-1/incomes"]')).toBeTruthy();
  });

  it('cria lançamento e apresenta corretamente eventos corporativos', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.selectedWalletId.set('wallet-1');
    component.recordForm.patchValue({
      type: 'COMPRA', assetId: 'asset-1', quantity: 1, totalValue: 100
    });
    component.saveRecord();
    expect(api.createRecord).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1, totalValue: 100 }));
    expect(component.recordValue({ ...item, totalValue: undefined, quantity: undefined,
      type: 'DESDOBRAMENTO', newQuantity: 20, ratio: '1:2' })).toBe('20 un. · 1:2');
    expect(component.operationDetails(item)).toBe('10 un. · Preço unitário R$ 9,50');
    expect(component.operationDetails({ ...item, type: 'VENDA', unitPrice: undefined })).toBe('10 un.');
    expect(component.operationDetails({ ...item, type: 'SUBSCRICAO' }))
      .toBe('10 un. · Preço unitário R$ 9,50');
    expect(component.operationDetails({ ...item, type: 'DIVIDENDO' })).toBe('');
    component.recordForm.controls.type.setValue('JCP');
    expect(component.isIncome()).toBe(true);
    component.recordForm.controls.type.setValue('BONIFICACAO');
    expect(component.isBonus()).toBe(true);
    component.recordForm.controls.type.setValue('GRUPAMENTO');
    expect(component.isCorporateEvent()).toBe(true);
    expect(component.recordTypes.map(type => component.typeInitial(type.value)))
      .toEqual(['C', 'V', 'S', 'D', 'J', 'B', 'D', 'G']);
    component.cancelEdit();
  });

  it('lista o catálogo na compra e somente ativos da carteira nos demais tipos', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.assets.set([
      { id: 'asset-1', ticker: 'PETR4', name: 'Petrobras', category: 'ACAO', currentPrice: 30, priceDate: '2026-07-31' },
      { id: 'asset-2', ticker: 'VALE3', name: 'Vale', category: 'ACAO', currentPrice: 60, priceDate: '2026-07-31' }
    ]);
    component.records.set([item]);

    expect(component.availableAssets().map(asset => asset.id)).toEqual(['asset-1', 'asset-2']);
    component.onPurchaseAssetInput('vale');
    expect(component.filteredPurchaseAssets().map(asset => asset.id)).toEqual(['asset-2']);
    expect(component.recordForm.controls.assetId.value).toBe('');
    component.onPurchaseAssetInput('VALE3');
    expect(component.recordForm.controls.assetId.value).toBe('asset-2');

    component.recordForm.patchValue({ type: 'VENDA', assetId: 'asset-2' });
    component.onRecordTypeChange();

    expect(component.availableAssets().map(asset => asset.id)).toEqual(['asset-1']);
    expect(component.recordForm.controls.assetId.value).toBe('');
  });

  it('posiciona valor total ao lado da data em dividendos e JCP', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.openRecordModal();
    fixture.detectChanges();
    component.recordForm.controls.type.setValue('DIVIDENDO');
    fixture.detectChanges();

    const totalValue = fixture.nativeElement.querySelector('.total-value');
    expect(totalValue.classList.contains('income-total-value')).toBe(true);

    component.recordForm.controls.type.setValue('COMPRA');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.total-value').classList.contains('income-total-value')).toBe(false);

    const actions = fixture.nativeElement.querySelector('.form-actions');
    const messageSlot = fixture.nativeElement.querySelector('.form-message-slot');
    expect(actions.compareDocumentPosition(messageSlot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(messageSlot).not.toBeNull();
  });

  it('abre cadastro e edição em modal e mantém os três painéis lado a lado', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.wallets.set([{ id: 'wallet-1', name: 'Principal', currentValue: 0 }]);
    component.selectedWalletId.set('wallet-1');
    component.dashboard.set(dashboard);
    component.records.set([item]);
    fixture.detectChanges();

    const heroButton: HTMLButtonElement = fixture.nativeElement.querySelector('.hero-actions .new-record-button');
    expect(heroButton).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.workspace form.stack-form')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.dashboard-insights-grid > article')).toHaveLength(3);

    heroButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"] form.stack-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#record-modal-title').textContent).toContain('Novo lançamento');
    component.cancelEdit();
    fixture.detectChanges();

    const editButton: HTMLButtonElement = fixture.nativeElement.querySelector('.activity-actions button');
    editButton.click();
    fixture.detectChanges();
    expect(component.editingId()).toBe('record-1');
    expect(fixture.nativeElement.querySelector('#record-modal-title').textContent).toContain('Editar lançamento');
  });

  it('carrega os últimos 12 meses e seleciona os proventos de um mês', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T12:00:00-03:00'));
    api.incomes.mockReturnValueOnce(of({ total: 30, groups: [], items: [
      { id: 'income-1', assetId: 'asset-1', ticker: 'PETR4', category: 'ACAO', type: 'DIVIDENDO',
        date: '2026-08-10', totalValue: 20 },
      { id: 'income-2', assetId: 'asset-2', ticker: 'VALE3', category: 'ACAO', type: 'JCP',
        date: '2026-07-10', totalValue: 10 }
    ] }));
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.selectedWalletId.set('wallet-1');
    component.loadIncomes();

    expect(api.incomes).toHaveBeenCalledWith('wallet-1', {
      from: '2025-09-01', to: '2026-08-31', groupBy: 'MONTHLY'
    });
    expect(component.incomeMonths).toHaveLength(12);
    expect(component.incomeMonths[0]).toBe('2026-08');
    expect(component.incomeMonths[11]).toBe('2025-09');
    expect(component.selectedMonthIncomes().map(income => income.id)).toEqual(['income-1']);

    component.selectIncomeMonth('2026-07');
    expect(component.selectedMonthIncomes().map(income => income.id)).toEqual(['income-2']);
  });

  it('monta payloads de provento, bonificação e evento e trata erros', async () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.selectedWalletId.set('wallet-1');
    component.recordForm.patchValue({ type: 'JCP', assetId: 'asset-1', totalValue: 25, unitPrice: 2.5,
      description: 'Provento' });
    component.saveRecord();
    expect(api.createRecord).toHaveBeenLastCalledWith(expect.objectContaining({
      type: 'JCP', totalValue: 25, unitPrice: 2.5, description: 'Provento'
    }));

    component.recordForm.patchValue({ type: 'BONIFICACAO', assetId: 'asset-1', quantity: 3 });
    component.saveRecord();
    expect(api.createRecord).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'BONIFICACAO', quantity: 3 }));

    component.recordForm.patchValue({ type: 'DESDOBRAMENTO', assetId: 'asset-1', newQuantity: 30, ratio: '1:3' });
    component.saveRecord();
    expect(api.createRecord).toHaveBeenLastCalledWith(expect.objectContaining({ newQuantity: 30, ratio: '1:3' }));

    api.createRecord.mockReturnValueOnce(throwError(() => ({ error: { message: 'Falhou' } })));
    component.recordForm.patchValue({ type: 'COMPRA', assetId: 'asset-1', quantity: 1, totalValue: 1 });
    component.saveRecord();
    expect(component.message()).toBe('Falhou');

    api.deleteRecord.mockReturnValueOnce(throwError(() => ({ error: {} })));
    await component.deleteRecord(item);
    expect(component.message()).toBe('Não foi possível excluir o lançamento.');
    expect(component.recordValue({ ...item, totalValue: undefined, quantity: 2 })).toBe('2 un.');
    expect(component.label('DESCONHECIDO')).toBe('DESCONHECIDO');
    component.logout();
    expect(session.clear).toHaveBeenCalled();
  });

  it('renderiza estados indisponíveis, indicadores, evolução e evento corporativo', () => {
    api.assets.mockReturnValueOnce(of([{ id: 'asset-1', ticker: 'PETR4', name: 'Petrobras',
      category: 'ACAO', currentPrice: null, priceDate: null }]));
    api.dashboard.mockReturnValue(of({
      acquisitionCost: 1000, currentValue: null, profitLoss: null, returnPercentage: null,
      totalIncome: 25, largestPosition: null,
      categories: [{ category: 'ACAO', acquisitionCost: 1000, currentValue: null,
        profitLoss: null, returnPercentage: null, allocationPercentage: null }],
      positions: [{ assetId: 'asset-1', ticker: 'PETR4', name: 'Petrobras', category: 'ACAO',
        quantity: 20, acquisitionCost: 1000, currentPrice: null, currentValue: null,
        profitLoss: null, returnPercentage: null, allocationPercentage: null, totalIncome: 25, priceDate: null }],
      evolution: [{ period: '2026-01', acquisitionCost: 1000 }]
    }));
    api.records.mockReturnValue(of([{ ...item, type: 'DESDOBRAMENTO', totalValue: undefined,
      quantity: undefined, newQuantity: 20, ratio: '1:2' }]));
    api.incomes.mockReturnValue(of({ total: 25, groups: [{ period: '2026-08', total: 25 }], items: [{
      id: 'income-1', assetId: 'asset-1', ticker: 'PETR4', category: 'ACAO', type: 'DIVIDENDO',
      date: '2026-08-10', totalValue: 25
    }] }));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Indisponível');
    expect(text).toContain('PETR4');
    expect(text).toContain('20 un. · 1:2');
    expect(text).toContain('janeiro de 2026');
    expect(text).toContain('10/08/2026');
    expect(text).toContain('Dividendo');
    expect(fixture.nativeElement.querySelectorAll('.income-month-details')).toHaveLength(12);
    expect(fixture.nativeElement.querySelectorAll('.income-selected-month')).toHaveLength(12);
    expect(fixture.nativeElement.querySelectorAll('.income-month-details.open table')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.income-selected-month').getAttribute('aria-expanded')).toBe('true');
    expect(text).not.toContain('Total filtrado');
    expect(fixture.nativeElement.querySelector('.dashboard-insights-grid .filter-grid')).toBeNull();
    expect(fixture.nativeElement.querySelector('.position-income').textContent).toMatch(/25[,.]00/);
    expect(fixture.nativeElement.querySelector('#posicoes').classList.contains('positions-overview-grid')).toBe(true);
  });

  it('formata períodos mensais, trimestrais e anuais em português', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;

    expect(component.periodLabel('2026-01')).toBe('janeiro de 2026');
    expect(component.periodLabel('2026-12')).toBe('dezembro de 2026');
    expect(component.periodLabel('2026-T3')).toBe('3º trimestre de 2026');
    expect(component.periodLabel('2026')).toBe('2026');
    expect(component.periodLabel('período inválido')).toBe('período inválido');
  });
});
