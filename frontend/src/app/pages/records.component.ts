import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, LedgerItem } from '../core/api.service';
import { RecordFormComponent } from '../shared/record-form.component';

@Component({
  selector: 'app-records',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RecordFormComponent, RouterLink],
  template: `
    <header class="topbar">
      <a class="brand dark" routerLink="/"><span>M</span> MAD</a>
      <nav class="topbar-menu"><a routerLink="/">Visão geral</a>
        <a [routerLink]="['/wallets', walletId, 'positions']">Posições</a>
        <a [routerLink]="['/wallets', walletId, 'records']">Lançamentos</a>
        <a [routerLink]="['/wallets', walletId, 'incomes']">Proventos</a>
      </nav>
      <a routerLink="/">Voltar à carteira</a>
    </header>
    <main class="workspace">
      <section class="hero-row records-page-heading">
        <div>
          <p class="eyebrow">{{ walletName() || 'Carteira' }}</p>
          <h1>Histórico de lançamentos</h1>
          <p class="muted">Todos os registros da carteira, do mais recente para o mais antigo.</p>
        </div>
        <div class="records-page-actions">
          <span class="chip">{{ filteredRecords().length }} de {{ records().length }} lançamentos</span>
          <a class="button primary" [routerLink]="['/wallets', walletId, 'records']"
            fragment="novo-lancamento">Novo lançamento</a>
        </div>
      </section>

      <section class="page-detail-grid records-page-grid">
        <article class="panel record-create-panel" id="novo-lancamento">
          <div class="panel-title"><div><p class="eyebrow">Novo registro</p><h2>Adicionar lançamento</h2></div></div>
          <app-record-form [walletId]="walletId" (saved)="loadRecords()" />
        </article>
        <div class="page-detail-content">
          <section class="panel records-filters">
            <div class="panel-title"><div><p class="eyebrow">Refine a consulta</p><h2>Filtros</h2></div></div>
            <form class="filter-grid records-filter" [formGroup]="filterForm" (ngSubmit)="applyFilters()">
              <label>Período inicial<input type="date" formControlName="from"></label>
              <label>Período final<input type="date" formControlName="to"></label>
              <label>Tipo<select formControlName="type"><option value="">Todos</option>
                @for (type of recordTypes; track type.value) { <option [value]="type.value">{{ type.label }}</option> }
              </select></label>
              <label>Ativo<select formControlName="assetId"><option value="">Todos</option>
                @for (asset of recordAssets(); track asset.id) { <option [value]="asset.id">{{ asset.ticker }}</option> }
              </select></label>
              <div class="records-filter-actions">
                <button class="button primary" type="submit">Filtrar</button>
                <button class="button secondary" type="button" (click)="clearFilters()">Limpar filtros</button>
              </div>
            </form>
          </section>

          <section class="panel records-history-panel">
            @if (records().length) {
              @if (filteredRecords().length) {
                <div class="table-scroll"><table>
                  <thead><tr><th>Data</th><th>Tipo</th><th>Ativo</th><th>Quantidade</th>
                    <th>Preço unitário</th><th>Taxas</th><th>Valor total</th><th>Detalhes</th><th>Descrição</th></tr></thead>
                  <tbody>
                    @for (item of filteredRecords(); track item.id) {
                      <tr><td>{{ item.date | date:'dd/MM/yyyy':'UTC' }}</td>
                        <td><span class="activity-icon">{{ typeInitial(item.type) }}</span> {{ label(item.type) }}</td>
                        <td><strong>{{ item.ticker }}</strong></td>
                        <td>{{ item.quantity == null ? '—' : (item.quantity | number:'1.0-8') }}</td>
                        <td>{{ item.unitPrice == null ? '—' : (item.unitPrice | currency:'BRL') }}</td>
                        <td>{{ item.fees == null ? '—' : (item.fees | currency:'BRL') }}</td>
                        <td>{{ item.totalValue == null ? '—' : (item.totalValue | currency:'BRL') }}</td>
                        <td>{{ eventDetails(item) }}</td><td>{{ item.description || '—' }}</td></tr>
                    }
                  </tbody>
                </table></div>
              } @else { <p class="empty-copy">Nenhum lançamento encontrado para os filtros selecionados.</p> }
            } @else { <p class="empty-copy">Nenhum lançamento nesta carteira.</p> }
          </section>
        </div>
      </section>
    </main>
  `,
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
