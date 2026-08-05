import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService, Asset, LedgerItem } from '../../core/api.service';
import { RecordFormComponent } from './record-form.component';

describe('RecordFormComponent', () => {
  const assets: Asset[] = [
    { id: 'a1', ticker: 'PETR4', name: 'Petrobras', category: 'ACAO', currentPrice: 30, priceDate: '2026-08-01' },
    { id: 'a2', ticker: 'VALE3', name: 'Vale', category: 'ACAO', currentPrice: 60, priceDate: '2026-08-01' },
  ];
  const record: LedgerItem = {
    id: 'r1',
    walletId: 'w1',
    assetId: 'a1',
    ticker: 'PETR4',
    type: 'COMPRA',
    date: '2026-08-01',
    quantity: 1,
    totalValue: 30,
  };
  const api = { assets: vi.fn(), records: vi.fn(), createRecord: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    api.assets.mockReturnValue(of(assets));
    api.records.mockReturnValue(of([record]));
    api.createRecord.mockReturnValue(of(record));
    await TestBed.configureTestingModule({
      imports: [RecordFormComponent],
      providers: [{ provide: ApiService, useValue: api }],
    }).compileComponents();
  });

  it('cadastra compra pesquisando o ativo e emite o registro salvo', () => {
    const fixture = TestBed.createComponent(RecordFormComponent);
    fixture.componentRef.setInput('walletId', 'w1');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const emitted = vi.fn();
    component.saved.subscribe(emitted);
    component.onPurchaseAssetInput('petr4');
    component.form.patchValue({ quantity: 2, totalValue: 61, unitPrice: 30, fees: 1 });
    component.save();

    expect(api.createRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        walletId: 'w1',
        assetId: 'a1',
        type: 'COMPRA',
        quantity: 2,
        totalValue: 61,
        unitPrice: 30,
        fees: 1,
      }),
    );
    expect(emitted).toHaveBeenCalledWith(record);
    expect(component.message()).toContain('sucesso');
  });

  it('restringe tipos, lista somente ativos da carteira e trata erro', () => {
    api.createRecord.mockReturnValue(throwError(() => ({ error: { message: 'Falhou' } })));
    const fixture = TestBed.createComponent(RecordFormComponent);
    fixture.componentRef.setInput('walletId', 'w1');
    fixture.componentRef.setInput('allowedTypes', ['DIVIDENDO', 'JCP']);
    fixture.componentRef.setInput('initialType', 'DIVIDENDO');
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.visibleRecordTypes().map((type) => type.value)).toEqual(['DIVIDENDO', 'JCP']);
    expect(component.availableAssets().map((asset) => asset.id)).toEqual(['a1']);
    component.form.patchValue({ assetId: 'a1', totalValue: 20, unitPrice: 2 });
    component.save();
    expect(api.createRecord).toHaveBeenCalledWith(expect.objectContaining({ type: 'DIVIDENDO', totalValue: 20 }));
    expect(component.message()).toBe('Falhou');

    component.form.controls.type.setValue('JCP');
    component.onTypeChange();
    expect(component.isIncome()).toBe(true);
  });

  it('configura bonificação e evento corporativo com os campos corretos', () => {
    const fixture = TestBed.createComponent(RecordFormComponent);
    fixture.componentRef.setInput('walletId', 'w1');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.patchValue({ type: 'BONIFICACAO', assetId: 'a1', quantity: 3 });
    component.onTypeChange();
    expect(component.isBonus()).toBe(true);
    component.save();
    expect(api.createRecord).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'BONIFICACAO', quantity: 3 }));

    component.form.patchValue({ type: 'DESDOBRAMENTO', assetId: 'a1', newQuantity: 20, ratio: '1:2' });
    component.onTypeChange();
    expect(component.isCorporateEvent()).toBe(true);
    component.save();
    expect(api.createRecord).toHaveBeenLastCalledWith(expect.objectContaining({ newQuantity: 20, ratio: '1:2' }));
  });
});
