import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService, LedgerItem, Note, Position } from '../core/api.service';
import { ModalService } from '../core/modal.service';
import { AssetDetailComponent } from './asset-detail.component';

describe('AssetDetailComponent', () => {
  const position: Position = { assetId: 'a1', ticker: 'PETR4', name: 'Petrobras', category: 'ACAO',
    quantity: 10, acquisitionCost: 200, currentPrice: 30, currentValue: 300, profitLoss: 100,
    returnPercentage: 50, allocationPercentage: 25, totalIncome: 10, priceDate: '2026-07-31' };
  const record: LedgerItem = { id: 'r1', walletId: 'w1', assetId: 'a1', ticker: 'PETR4',
    type: 'DIVIDENDO', date: '2026-07-30', totalValue: 10 };
  const note: Note = { id: 'n1', walletId: 'w1', assetId: 'a1', ticker: 'PETR4', content: 'Tese',
    createdAt: '2026-07-30T10:00:00Z', updatedAt: '2026-07-30T10:00:00Z' };
  const api = { dashboard: vi.fn(), records: vi.fn(), notes: vi.fn(), createNote: vi.fn(),
    updateNote: vi.fn(), deleteNote: vi.fn() };
  const modal = { confirm: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    api.dashboard.mockReturnValue(of({ positions: [position] }));
    api.records.mockReturnValue(of([record]));
    api.notes.mockReturnValue(of([note]));
    api.createNote.mockReturnValue(of(note)); api.updateNote.mockReturnValue(of(note));
    api.deleteNote.mockReturnValue(of(undefined));
    modal.confirm.mockResolvedValue(true);
    await TestBed.configureTestingModule({ imports: [AssetDetailComponent], providers: [
      provideRouter([]), { provide: ApiService, useValue: api },
      { provide: ModalService, useValue: modal },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ walletId: 'w1', assetId: 'a1' }) } } }
    ] }).compileComponents();
  });

  it('renderiza todos os indicadores e ações contextuais', () => {
    const fixture = TestBed.createComponent(AssetDetailComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    for (const expected of ['Cotação', 'Data da cotação', 'Resultado (P&L)', 'Alocação',
      'Compra', 'Venda', 'Subscrição', 'Provento', 'Bonificação', 'Desdobramento', 'Grupamento']) {
      expect(text).toContain(expected);
    }
    expect(fixture.componentInstance.context('VENDA')).toEqual({ wallet: 'w1', asset: 'a1', type: 'VENDA' });
  });

  it('filtra históricos e executa CRUD de notas', async () => {
    const component = TestBed.createComponent(AssetDetailComponent).componentInstance;
    component.ngOnInit();
    component.filter.set('PROVENTOS');
    expect(component.filteredRecords()).toHaveLength(1);
    component.filter.set('OPERACOES'); expect(component.filteredRecords()).toHaveLength(0);
    expect(component.historyValue(record)).toContain('10');
    expect(component.historyValue({ ...record, totalValue: undefined, newQuantity: 20, ratio: '1:2' })).toContain('1:2');
    component.noteForm.setValue({ content: 'Nova' }); component.saveNote();
    expect(api.createNote).toHaveBeenCalled();
    component.editNote(note); component.noteForm.setValue({ content: 'Editada' }); component.saveNote();
    expect(api.updateNote).toHaveBeenCalledWith('n1', expect.objectContaining({ content: 'Editada' }));
    await component.deleteNote(note);
    expect(api.deleteNote).toHaveBeenCalledWith('n1');
  });
});
