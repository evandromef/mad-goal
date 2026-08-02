import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Dashboard } from '../core/api.service';
import { RecordFormComponent } from '../shared/record-form.component';

@Component({
  selector: 'app-positions',
  imports: [CurrencyPipe, DecimalPipe, RecordFormComponent, RouterLink],
  template: `
    <header class="topbar"><a class="brand dark" routerLink="/"><span>M</span> MAD</a>
      <nav class="topbar-menu"><a routerLink="/">Visão geral</a>
        <a [routerLink]="['/wallets', walletId, 'positions']">Posições</a>
        <a [routerLink]="['/wallets', walletId, 'records']">Lançamentos</a>
        <a [routerLink]="['/wallets', walletId, 'incomes']">Proventos</a></nav>
      <a routerLink="/">Voltar à carteira</a></header>
    <main class="workspace">
      <section class="hero-row records-page-heading"><div><p class="eyebrow">{{ walletName() || 'Carteira' }}</p>
        <h1>Posições da carteira</h1><p class="muted">Composição atual, custos e resultados por ativo.</p></div>
        <span class="chip">{{ dashboard()?.positions?.length ?? 0 }} ativos</span>
      </section>
      <section class="page-detail-grid">
        <article class="panel record-create-panel"><p class="eyebrow">Novo registro</p><h2>Adicionar lançamento</h2>
          <app-record-form [walletId]="walletId" [allowedTypes]="positionRecordTypes"
            initialType="COMPRA" (saved)="loadDashboard()" />
        </article>
        <article class="panel">
          <div class="panel-title"><div><p class="eyebrow">Composição</p><h2>Todos os ativos</h2></div></div>
          @if (dashboard(); as data) {
            @if (data.positions.length) {
              <div class="table-scroll"><table>
                <thead><tr><th>Ativo</th><th>Categoria</th><th>Quantidade</th><th>Custo</th>
                  <th>Cotação</th><th>Valor atual</th><th>Proventos</th><th>Resultado</th><th>Rentabilidade</th><th>Alocação</th></tr></thead>
                <tbody>@for (position of data.positions; track position.assetId) {
                  <tr><td><a [routerLink]="['/assets', walletId, position.assetId]"><strong>{{ position.ticker }}</strong></a><small>{{ position.name }}</small></td>
                    <td>{{ position.category === 'ACAO' ? 'Ação' : 'FII' }}</td>
                    <td>{{ position.quantity | number:'1.0-8' }}</td>
                    <td>{{ position.acquisitionCost | currency:'BRL' }}</td>
                    <td>{{ position.currentPrice == null ? 'Indisponível' : (position.currentPrice | currency:'BRL') }}</td>
                    <td>{{ position.currentValue == null ? 'Indisponível' : (position.currentValue | currency:'BRL') }}</td>
                    <td class="position-income">{{ position.totalIncome | currency:'BRL' }}</td>
                    <td [class.negative]="position.profitLoss != null && position.profitLoss < 0">{{ position.profitLoss == null ? 'Indisponível' : (position.profitLoss | currency:'BRL') }}</td>
                    <td>{{ position.returnPercentage == null ? 'Indisponível' : ((position.returnPercentage | number:'1.2-2') + '%') }}</td>
                    <td>{{ position.allocationPercentage == null ? '—' : ((position.allocationPercentage | number:'1.2-2') + '%') }}</td></tr>
                }</tbody>
              </table></div>
            } @else { <p class="empty-copy">Registre uma compra para criar a primeira posição.</p> }
          }
        </article>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  readonly walletId = this.route.snapshot.paramMap.get('walletId') ?? '';
  readonly walletName = signal('');
  readonly dashboard = signal<Dashboard | null>(null);
  readonly positionRecordTypes = ['COMPRA', 'VENDA', 'SUBSCRICAO', 'BONIFICACAO', 'DESDOBRAMENTO', 'GRUPAMENTO'];

  ngOnInit(): void {
    this.loadDashboard();
    this.api.wallets().subscribe(wallets =>
      this.walletName.set(wallets.find(wallet => wallet.id === this.walletId)?.name ?? ''));
  }
  loadDashboard(): void { this.api.dashboard(this.walletId).subscribe(data => this.dashboard.set(data)); }
}
