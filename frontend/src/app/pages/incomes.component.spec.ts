import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { IncomesComponent } from './incomes.component';

describe('IncomesComponent', () => {
  const api = { assets: vi.fn(), wallets: vi.fn(), incomes: vi.fn(), records: vi.fn(), createRecord: vi.fn() };
  beforeEach(async () => {
    vi.clearAllMocks();
    api.assets.mockReturnValue(of([{ id: 'a1', ticker: 'PETR4', name: 'Petrobras', category: 'ACAO', currentPrice: 30, priceDate: null }]));
    api.wallets.mockReturnValue(of([{ id: 'w1', name: 'Principal', currentValue: 100 }]));
    api.records.mockReturnValue(of([{ id: 'r1', walletId: 'w1', assetId: 'a1', ticker: 'PETR4', type: 'COMPRA', date: '2026-01-01' }]));
    api.incomes.mockReturnValue(of({ total: 25, groups: [{ period: '2026-01', total: 25 }], items: [
      { id: 'i1', assetId: 'a1', ticker: 'PETR4', category: 'ACAO', type: 'DIVIDENDO', date: '2026-01-15', totalValue: 25 }
    ] }));
    await TestBed.configureTestingModule({ imports: [IncomesComponent], providers: [provideRouter([]),
      { provide: ApiService, useValue: api }, { provide: ActivatedRoute, useValue: {
        snapshot: { paramMap: convertToParamMap({ walletId: 'w1' }) }
      } }
    ] }).compileComponents();
  });

  it('exibe proventos, filtros e formulário restrito a dividendo e JCP', () => {
    const fixture = TestBed.createComponent(IncomesComponent); fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(api.incomes).toHaveBeenCalledWith('w1', { groupBy: 'MONTHLY' });
    expect(component.walletName()).toBe('Principal');
    expect(component.incomeAssets().map(item => item.id)).toEqual(['a1']);
    expect(component.incomeRecordTypes).toEqual(['DIVIDENDO', 'JCP']);
    expect(component.periodLabel('2026-01')).toBe('janeiro de 2026');
    expect(component.periodLabel('2026-T2')).toBe('2º trimestre de 2026');
    expect(component.periodLabel('2026')).toBe('2026');
    expect(fixture.nativeElement.querySelector('app-record-form')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('R$');
  });

  it('aplica filtros combinados', () => {
    const component = TestBed.createComponent(IncomesComponent).componentInstance;
    component.filterForm.setValue({ assetId: 'a1', category: 'ACAO', type: 'DIVIDENDO',
      from: '2026-01-01', to: '2026-01-31', groupBy: 'YEARLY' });
    component.loadIncomes();
    expect(api.incomes).toHaveBeenLastCalledWith('w1', { assetId: 'a1', category: 'ACAO',
      type: 'DIVIDENDO', from: '2026-01-01', to: '2026-01-31', groupBy: 'YEARLY' });
  });
});
