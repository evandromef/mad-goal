import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, LedgerItem } from '../../core/api.service';
import { RecordFormComponent } from '../../shared/record-form/record-form.component';

@Component({
  selector: 'app-records',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RecordFormComponent, RouterLink],
  templateUrl: './records.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly walletId = this.route.snapshot.paramMap.get('walletId') ?? '';
  readonly walletName = signal('');
  readonly records = signal<LedgerItem[]>([]);
  readonly filters = signal({ from: '', to: '', type: '', assetId: '' });
  readonly recordTypes = [
    { value: 'COMPRA', label: 'Compra' }, { value: 'VENDA', label: 'Venda' },
    { value: 'SUBSCRICAO', label: 'Subscrição' }, { value: 'DIVIDENDO', label: 'Dividendo' },
    { value: 'JCP', label: 'JCP' }, { value: 'BONIFICACAO', label: 'Bonificação' },
    { value: 'DESDOBRAMENTO', label: 'Desdobramento' }, { value: 'GRUPAMENTO', label: 'Grupamento' }
  ];
  readonly filterForm = this.fb.nonNullable.group({ from: '', to: '', type: '', assetId: '' });
  readonly recordAssets = computed(() => Array.from(
    new Map(this.records().map(item => [item.assetId, { id: item.assetId, ticker: item.ticker }])).values()
  ).sort((a, b) => a.ticker.localeCompare(b.ticker, 'pt-BR')));
  readonly filteredRecords = computed(() => {
    const filters = this.filters();
    return this.records().filter(item =>
      (!filters.from || item.date >= filters.from) &&
      (!filters.to || item.date <= filters.to) &&
      (!filters.type || item.type === filters.type) &&
      (!filters.assetId || item.assetId === filters.assetId)
    ).reverse();
  });

  ngOnInit(): void {
    this.loadRecords();
    this.api.wallets().subscribe(wallets =>
      this.walletName.set(wallets.find(wallet => wallet.id === this.walletId)?.name ?? ''));
  }

  loadRecords(): void { this.api.records(this.walletId).subscribe(items => this.records.set(items)); }

  applyFilters(): void { this.filters.set(this.filterForm.getRawValue()); }
  clearFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }
  label(type: string): string { return this.recordTypes.find(item => item.value === type)?.label ?? type; }
  typeInitial(type: string): string { return this.label(type).charAt(0).toUpperCase(); }
  eventDetails(item: LedgerItem): string {
    if (item.newQuantity != null) return `${item.newQuantity.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} un. · ${item.ratio ?? 'sem proporção'}`;
    return item.ratio ?? '—';
  }
}
