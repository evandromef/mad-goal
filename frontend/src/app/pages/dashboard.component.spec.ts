import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService, Dashboard, LedgerItem } from '../core/api.service';
import { DashboardComponent } from './dashboard.component';

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
    records: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    api.updateRecord.mockReturnValue(of(item));
    api.deleteRecord.mockReturnValue(of(undefined));
    api.dashboard.mockReturnValue(of(dashboard));
    api.records.mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api }
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
    expect(api.dashboard).toHaveBeenCalledWith('wallet-1');
    expect(api.records).toHaveBeenCalledWith('wallet-1');
    expect(component.successMessage()).toBe('Lançamento excluído com sucesso.');
    expect(component.message()).toBe('');
  });
});
