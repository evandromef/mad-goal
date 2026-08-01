import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Asset, IncomeResponse } from '../core/api.service';
import { RecordFormComponent } from '../shared/record-form.component';

@Component({
  selector: 'app-incomes',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RecordFormComponent, RouterLink],
  template: `
    <header class="topbar"><a class="brand dark" routerLink="/"><span>M</span> MAD</a>
      <nav class="topbar-menu"><a routerLink="/">Visão geral</a>
        <a [routerLink]="['/wallets', walletId, 'positions']">Posições</a>
        <a [routerLink]="['/wallets', walletId, 'records']">Lançamentos</a>
        <a [routerLink]="['/wallets', walletId, 'incomes']">Proventos</a></nav>
      <a routerLink="/">Voltar à carteira</a></header>
    <main class="workspace">
      <section class="hero-row records-page-heading"><div><p class="eyebrow">{{ walletName() || 'Carteira' }}</p>
        <h1>Proventos</h1><p class="muted">Dividendos e juros sobre capital próprio recebidos.</p></div>
        <span class="chip">{{ incomeData()?.items?.length ?? 0 }} registros</span>
      </section>
      <section class="page-detail-grid">
        <article class="panel record-create-panel"><p class="eyebrow">Novo registro</p><h2>Adicionar provento</h2>
          <app-record-form [walletId]="walletId" [allowedTypes]="incomeRecordTypes"
            initialType="DIVIDENDO" (saved)="loadIncomes()" />
        </article>
        <div class="page-detail-content">
          <section class="panel records-filters"><p class="eyebrow">Refine a consulta</p><h2>Filtros</h2>
            <form class="filter-grid income-page-filter" [formGroup]="filterForm" (ngSubmit)="loadIncomes()">
              <label>Ativo<select formControlName="assetId"><option value="">Todos</option>
                @for (asset of incomeAssets(); track asset.id) { <option [value]="asset.id">{{ asset.ticker }}</option> }
              </select></label>
              <label>Categoria<select formControlName="category"><option value="">Todas</option>
                <option value="ACAO">Ações</option><option value="FII">FIIs</option></select></label>
              <label>Tipo<select formControlName="type"><option value="">Todos</option>
                <option value="DIVIDENDO">Dividendos</option><option value="JCP">JCP</option></select></label>
              <label>Período inicial<input type="date" formControlName="from"></label>
              <label>Período final<input type="date" formControlName="to"></label>
              <label>Agrupar<select formControlName="groupBy"><option value="MONTHLY">Mensal</option>
                <option value="QUARTERLY">Trimestral</option><option value="YEARLY">Anual</option></select></label>
              <button class="button secondary" type="submit">Filtrar</button>
            </form>
          </section>
          <section class="panel">
            @if (incomeData(); as income) {
              <p class="income-total">Total filtrado <strong>{{ income.total | currency:'BRL' }}</strong></p>
              @for (group of income.groups; track group.period) {
                <div class="category-row"><span>{{ periodLabel(group.period) }}</span><strong>{{ group.total | currency:'BRL' }}</strong></div>
              }
              <div class="table-scroll income-page-history"><table>
                <thead><tr><th>Data</th><th>Ativo</th><th>Categoria</th><th>Tipo</th><th>Valor</th></tr></thead>
                <tbody>@for (item of income.items; track item.id) {
                  <tr><td>{{ item.date | date:'dd/MM/yyyy':'UTC' }}</td><td><strong>{{ item.ticker }}</strong></td>
                    <td>{{ item.category === 'ACAO' ? 'Ação' : 'FII' }}</td><td>{{ item.type === 'DIVIDENDO' ? 'Dividendo' : 'JCP' }}</td>
                    <td>{{ item.totalValue | currency:'BRL' }}</td></tr>
                }</tbody>
              </table></div>
              @if (!income.items.length) { <p class="empty-copy">Nenhum provento encontrado.</p> }
            }
          </section>
        </div>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncomesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly walletId = this.route.snapshot.paramMap.get('walletId') ?? '';
  readonly walletName = signal('');
  readonly assets = signal<Asset[]>([]);
  readonly incomeData = signal<IncomeResponse | null>(null);
  readonly incomeRecordTypes = ['DIVIDENDO', 'JCP'];
  readonly filterForm = this.fb.nonNullable.group({ assetId: '', category: '', type: '', from: '', to: '', groupBy: 'MONTHLY' });
  readonly incomeAssets = computed(() => {
    const ids = new Set(this.incomeData()?.items.map(item => item.assetId) ?? []);
    return this.assets().filter(asset => ids.has(asset.id));
  });

  ngOnInit(): void {
    this.api.assets().subscribe(assets => this.assets.set(assets));
    this.api.wallets().subscribe(wallets => this.walletName.set(wallets.find(item => item.id === this.walletId)?.name ?? ''));
    this.loadIncomes();
  }
  loadIncomes(): void {
    const filters = Object.fromEntries(Object.entries(this.filterForm.getRawValue()).filter(([, value]) => value));
    this.api.incomes(this.walletId, filters).subscribe(data => this.incomeData.set(data));
  }
  periodLabel(period: string): string {
    const month = /^(\d{4})-(\d{2})$/.exec(period);
    if (month) return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1)));
    const quarter = /^(\d{4})-T([1-4])$/.exec(period);
    return quarter ? `${quarter[2]}º trimestre de ${quarter[1]}` : period;
  }
}
