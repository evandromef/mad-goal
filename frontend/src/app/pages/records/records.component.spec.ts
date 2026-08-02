import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService, LedgerItem } from '../../core/api.service';
import { RecordsComponent } from './records.component';

describe('RecordsComponent', () => {
  const records: LedgerItem[] = Array.from({ length: 25 }, (_, index) => ({
    id: `r-${index}`, walletId: 'w-1', assetId: 'a-1', ticker: 'PETR4', type: 'COMPRA',
    date: `2026-07-${String(index + 1).padStart(2, '0')}`, quantity: 10, unitPrice: 9.5,
    fees: 1, totalValue: 96, description: `Registro ${index + 1}`
  }));
  const api = { records: vi.fn(), wallets: vi.fn(), assets: vi.fn(), createRecord: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    api.records.mockReturnValue(of(records));
    api.wallets.mockReturnValue(of([{ id: 'w-1', name: 'Principal', currentValue: 0 }]));
    api.assets.mockReturnValue(of([]));
    await TestBed.configureTestingModule({ imports: [RecordsComponent], providers: [
      provideRouter([]), { provide: ApiService, useValue: api },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ walletId: 'w-1' }) } } }
    ] }).compileComponents();
  });

  it('carrega e exibe todo o histórico em ordem decrescente', () => {
    const fixture = TestBed.createComponent(RecordsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(api.records).toHaveBeenCalledWith('w-1');
    expect(component.walletName()).toBe('Principal');
    expect(component.filteredRecords()).toHaveLength(25);
    expect(component.filteredRecords()[0].id).toBe('r-24');
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(25);
    expect(fixture.nativeElement.textContent).toContain('R$');
    expect(fixture.nativeElement.querySelector('a.button.primary').getAttribute('href'))
      .toBe('/wallets/w-1/records#novo-lancamento');
    expect(fixture.nativeElement.querySelector('app-record-form')).toBeTruthy();
    const grid = fixture.nativeElement.querySelector('.records-page-grid');
    expect(grid.children[0].matches('#novo-lancamento')).toBe(true);
    expect(grid.children[1].querySelector('.records-filters')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.topbar-menu a')).toHaveLength(4);
  });

  it('combina filtros por período, tipo e ativo e permite limpá-los', () => {
    const fixture = TestBed.createComponent(RecordsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.records.update(items => [...items, {
      ...records[0], id: 'sale', assetId: 'a-2', ticker: 'VALE3', type: 'VENDA', date: '2026-07-15'
    }]);
    component.filterForm.setValue({
      from: '2026-07-10', to: '2026-07-20', type: 'COMPRA', assetId: 'a-1'
    });
    component.applyFilters();

    expect(component.filteredRecords()).toHaveLength(11);
    expect(component.filteredRecords().every(item => item.type === 'COMPRA' && item.assetId === 'a-1')).toBe(true);
    expect(component.recordAssets().map(asset => asset.ticker)).toEqual(['PETR4', 'VALE3']);

    component.filterForm.setValue({ from: '', to: '', type: 'VENDA', assetId: 'a-2' });
    component.applyFilters();
    expect(component.filteredRecords().map(item => item.id)).toEqual(['sale']);
    component.clearFilters();
    expect(component.filterForm.getRawValue()).toEqual({ from: '', to: '', type: '', assetId: '' });
    expect(component.filteredRecords()).toHaveLength(26);
  });

  it('formata tipos, eventos e o estado vazio', () => {
    api.records.mockReturnValue(of([]));
    api.wallets.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(RecordsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.label('SUBSCRICAO')).toBe('Subscrição');
    expect(component.label('OUTRO')).toBe('OUTRO');
    expect(component.typeInitial('VENDA')).toBe('V');
    expect(component.eventDetails({ ...records[0], newQuantity: 20, ratio: '1:2' })).toBe('20 un. · 1:2');
    expect(component.eventDetails({ ...records[0], ratio: undefined })).toBe('—');
    expect(fixture.nativeElement.textContent).toContain('Nenhum lançamento');
  });
});
