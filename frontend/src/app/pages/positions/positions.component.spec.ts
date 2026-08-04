import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService, Dashboard } from '../../core/api.service';
import { PositionsComponent } from './positions.component';

describe('PositionsComponent', () => {
  const dashboard: Dashboard = { acquisitionCost: 100, currentValue: 120, profitLoss: 20,
    returnPercentage: 20, totalIncome: 5, largestPosition: 'PETR4', categories: [], evolution: [],
    positions: [
      { assetId: 'a1', ticker: 'PETR4', name: 'Petrobras', category: 'ACAO', quantity: 2,
        acquisitionCost: 100, currentPrice: 60, currentValue: 120, profitLoss: 20,
        returnPercentage: 20, allocationPercentage: 80, totalIncome: 35.5, priceDate: '2026-08-01' },
      { assetId: 'a2', ticker: 'HGLG11', name: 'CSHG Logística', category: 'FII', quantity: 1,
        acquisitionCost: 30, currentPrice: 30, currentValue: 30, profitLoss: 0,
        returnPercentage: 0, allocationPercentage: 20, totalIncome: 2, priceDate: '2026-08-01' }
    ] };
  const api = { dashboard: vi.fn(), wallets: vi.fn(), assets: vi.fn(), records: vi.fn(), createRecord: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks(); api.dashboard.mockReturnValue(of(dashboard));
    api.wallets.mockReturnValue(of([{ id: 'w1', name: 'Principal', currentValue: 120 }]));
    api.assets.mockReturnValue(of([])); api.records.mockReturnValue(of([]));
    await TestBed.configureTestingModule({ imports: [PositionsComponent], providers: [provideRouter([]),
      { provide: ApiService, useValue: api }, { provide: ActivatedRoute, useValue: {
        snapshot: { paramMap: convertToParamMap({ walletId: 'w1' }) }
      } }
    ] }).compileComponents();
  });

  it('exibe posições completas e o formulário de novo registro', () => {
    const fixture = TestBed.createComponent(PositionsComponent); fixture.detectChanges();
    expect(api.dashboard).toHaveBeenCalledWith('w1');
    expect(fixture.componentInstance.walletName()).toBe('Principal');
    expect(fixture.nativeElement.textContent).toContain('PETR4');
    expect(fixture.nativeElement.textContent).toContain('R$');
    expect(fixture.nativeElement.querySelector('.position-income').textContent).toMatch(/35[,.]50/);
    expect(fixture.nativeElement.querySelector('app-record-form')).toBeTruthy();
    expect(fixture.componentInstance.positionRecordTypes).not.toContain('DIVIDENDO');
  });

  it('filtra posições por ações ou FIIs e informa quando não há resultado', () => {
    const fixture = TestBed.createComponent(PositionsComponent);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('.compact-filter select');

    expect(select.closest('label')?.textContent).toContain('Tipo de ativo');
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('PETR4');
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('HGLG11');

    select.value = 'FII';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.filteredPositions().map(position => position.ticker)).toEqual(['HGLG11']);
    expect(fixture.nativeElement.querySelector('tbody').textContent).not.toContain('PETR4');
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('HGLG11');
    expect(fixture.nativeElement.querySelector('.chip').textContent).toContain('1 de 2 ativos');

    fixture.componentInstance.dashboard.set({ ...dashboard, positions: [dashboard.positions[0]] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Nenhuma posição encontrada para o tipo selecionado.');
  });
});
