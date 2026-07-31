import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService, Dashboard, LedgerItem } from '../core/api.service';
import { DashboardComponent } from './dashboard.component';
import { SessionService } from '../core/session.service';

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
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: SessionService, useValue: session }
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

  it('exclui após confirmação e recarrega a carteira', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.selectedWalletId.set('wallet-1');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteRecord(item);

    expect(api.deleteRecord).toHaveBeenCalledWith('record-1');
    expect(api.dashboard).toHaveBeenCalledWith('wallet-1', 'MONTHLY');
    expect(api.records).toHaveBeenCalledWith('wallet-1');
    expect(component.successMessage()).toBe('Lançamento excluído com sucesso.');
    expect(component.message()).toBe('');
  });

  it('carrega dados, gerencia carteira e alterna análises', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.ngOnInit();
    expect(component.selectedWalletId()).toBe('wallet-1');
    expect(api.assets).toHaveBeenCalled();
    expect(api.incomes).toHaveBeenCalled();

    component.walletForm.setValue({ name: 'Nova' });
    component.createWallet();
    expect(api.createWallet).toHaveBeenCalledWith('Nova');

    vi.spyOn(window, 'prompt').mockReturnValue('Renomeada');
    component.selectedWalletId.set('wallet-1');
    component.renameWallet();
    expect(api.updateWallet).toHaveBeenCalledWith('wallet-1', 'Renomeada');

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteWallet();
    expect(api.deleteWallet).toHaveBeenCalledWith('wallet-1');

    component.selectedWalletId.set('wallet-1');
    component.changeGranularity('YEARLY');
    expect(api.dashboard).toHaveBeenCalledWith('wallet-1', 'YEARLY');
    expect(component.evolutionWidth(10)).toBeGreaterThan(0);
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
    component.recordForm.controls.type.setValue('JCP');
    expect(component.isIncome()).toBe(true);
    component.recordForm.controls.type.setValue('BONIFICACAO');
    expect(component.isBonus()).toBe(true);
    component.recordForm.controls.type.setValue('GRUPAMENTO');
    expect(component.isCorporateEvent()).toBe(true);
    expect(component.icon('VENDA')).toBe('−');
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

  it('filtra proventos por ativo e expõe os ativos da carteira', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.selectedWalletId.set('wallet-1');
    component.assets.set([
      { id: 'asset-1', ticker: 'PETR4', name: 'Petrobras', category: 'ACAO', currentPrice: null, priceDate: null },
      { id: 'asset-2', ticker: 'VALE3', name: 'Vale', category: 'ACAO', currentPrice: null, priceDate: null }
    ]);
    component.records.set([item]);
    component.incomeForm.patchValue({ assetId: 'asset-1', type: 'DIVIDENDO', groupBy: 'QUARTERLY' });

    expect(component.incomeAssets().map(asset => asset.id)).toEqual(['asset-1']);
    component.loadIncomes();

    expect(api.incomes).toHaveBeenCalledWith('wallet-1', {
      assetId: 'asset-1', type: 'DIVIDENDO', groupBy: 'QUARTERLY'
    });
  });

  it('monta payloads de provento, bonificação e evento e trata erros', () => {
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
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteRecord(item);
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
        profitLoss: null, returnPercentage: null, allocationPercentage: null, priceDate: null }],
      evolution: [{ period: '2026-01', acquisitionCost: 1000 }]
    }));
    api.records.mockReturnValue(of([{ ...item, type: 'DESDOBRAMENTO', totalValue: undefined,
      quantity: undefined, newQuantity: 20, ratio: '1:2' }]));
    api.incomes.mockReturnValue(of({ total: 25, groups: [{ period: '2026-T1', total: 25 }], items: [{
      id: 'income-1', assetId: 'asset-1', ticker: 'PETR4', category: 'ACAO', type: 'DIVIDENDO',
      date: '2026-04-10', totalValue: 25
    }] }));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Indisponível');
    expect(text).toContain('PETR4');
    expect(text).toContain('20 un. · 1:2');
    expect(text).toContain('janeiro de 2026');
    expect(text).toContain('1º trimestre de 2026');
    expect(text).toContain('10/04/2026');
    expect(text).toContain('Dividendos');
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
