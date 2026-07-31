import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Asset, Dashboard, LedgerItem, Wallet } from '../core/api.service';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, DatePipe],
  template: `
    <header class="topbar">
      <a class="brand dark" href="/"><span>M</span> MAD</a>
      <nav><a href="#posicoes">Posições</a><a href="#lancamentos">Lançamentos</a></nav>
      <div class="user"><span>{{ userInitial() }}</span><button class="text-button" (click)="logout()">Sair</button></div>
    </header>
    <main class="workspace">
      <section class="hero-row">
        <div>
          <p class="eyebrow">Visão geral</p>
          <h1>Olá, {{ userName() }}.</h1>
          <p class="muted">Seu patrimônio, atualizado com a última cotação disponível.</p>
        </div>
        <div class="wallet-control">
          <label>Carteira
            <select [value]="selectedWalletId()" (change)="selectWallet($any($event.target).value)">
              @for (wallet of wallets(); track wallet.id) { <option [value]="wallet.id">{{ wallet.name }}</option> }
            </select>
          </label>
          <button class="button secondary" (click)="showWalletForm.set(!showWalletForm())">+ Carteira</button>
        </div>
      </section>

      @if (showWalletForm()) {
        <form class="inline-form" [formGroup]="walletForm" (ngSubmit)="createWallet()">
          <input formControlName="name" placeholder="Nome da nova carteira">
          <button class="button primary" type="submit">Criar</button>
        </form>
      }

      @if (!wallets().length) {
        <section class="empty">
          <p class="eyebrow">Primeiro passo</p><h2>Crie sua primeira carteira</h2>
          <p>Separe seus investimentos do jeito que fizer sentido para você.</p>
          <button class="button primary" (click)="showWalletForm.set(true)">Criar carteira</button>
        </section>
      } @else if (dashboard(); as data) {
        <section class="metrics">
          <article class="metric featured"><span>Patrimônio atual</span><strong>{{ data.currentValue | currency:'BRL' }}</strong><small>Última posição consolidada</small></article>
          <article class="metric"><span>Custo de aquisição</span><strong>{{ data.acquisitionCost | currency:'BRL' }}</strong><small>Capital alocado</small></article>
          <article class="metric"><span>Resultado</span><strong [class.negative]="data.profitLoss < 0">{{ data.profitLoss | currency:'BRL' }}</strong><small>{{ data.returnPercentage ?? 0 | number:'1.2-2' }}% de rentabilidade</small></article>
          <article class="metric"><span>Proventos</span><strong>{{ data.totalIncome | currency:'BRL' }}</strong><small>Recebidos no histórico</small></article>
        </section>

        <section class="content-grid" id="posicoes">
          <article class="panel wide">
            <div class="panel-title"><div><p class="eyebrow">Composição</p><h2>Posições da carteira</h2></div><span class="chip">{{ data.positions.length }} ativos</span></div>
            @if (data.positions.length) {
              <div class="table-scroll"><table>
                <thead><tr><th>Ativo</th><th>Qtd.</th><th>Custo</th><th>Valor atual</th><th>Resultado</th><th>Alocação</th></tr></thead>
                <tbody>
                  @for (position of data.positions; track position.assetId) {
                    <tr>
                      <td><strong>{{ position.ticker }}</strong><small>{{ position.category === 'ACAO' ? 'Ação' : 'FII' }}</small></td>
                      <td>{{ position.quantity | number:'1.0-6' }}</td>
                      <td>{{ position.acquisitionCost | currency:'BRL' }}</td>
                      <td>{{ position.currentValue | currency:'BRL' }}</td>
                      <td [class.negative]="position.profitLoss < 0">{{ position.profitLoss | currency:'BRL' }}</td>
                      <td><div class="allocation"><i [style.width.%]="position.allocationPercentage"></i></div>{{ position.allocationPercentage }}%</td>
                    </tr>
                  }
                </tbody>
              </table></div>
            } @else { <p class="empty-copy">Registre uma compra para começar a acompanhar sua posição.</p> }
          </article>
          <aside class="panel">
            <p class="eyebrow">Distribuição</p><h2>Por categoria</h2>
            @for (category of data.categories; track category.category) {
              <div class="category-row"><span>{{ category.category === 'ACAO' ? 'Ações' : 'FIIs' }}</span><strong>{{ category.allocationPercentage }}%</strong></div>
              <div class="allocation large"><i [style.width.%]="category.allocationPercentage"></i></div>
            }
            <div class="highlight"><span>Maior posição</span><strong>{{ data.largestPosition ?? '—' }}</strong></div>
          </aside>
        </section>

        <section class="content-grid" id="lancamentos">
          <article class="panel">
            <p class="eyebrow">Novo registro</p><h2>Adicionar lançamento</h2>
            <form [formGroup]="recordForm" (ngSubmit)="createRecord()" class="stack-form">
              <label>Tipo<select formControlName="type">
                @for (type of recordTypes; track type.value) { <option [value]="type.value">{{ type.label }}</option> }
              </select></label>
              <label>Ativo<select formControlName="assetId"><option value="">Selecione</option>
                @for (asset of assets(); track asset.id) { <option [value]="asset.id">{{ asset.ticker }} · {{ asset.name }}</option> }
              </select></label>
              <label>Data<input type="date" formControlName="date"></label>
              @if (isCorporateEvent()) {
                <label>Nova quantidade<input type="number" min="0.000001" step="0.000001" formControlName="newQuantity"></label>
                <label>Proporção<input formControlName="ratio" placeholder="Ex.: 1:2"></label>
              } @else {
                @if (!isIncome()) { <label>Quantidade<input type="number" min="0.000001" step="0.000001" formControlName="quantity"></label> }
                @if (!isBonus()) { <label>Valor total<input type="number" min="0.01" step="0.01" formControlName="totalValue"></label> }
              }
              <label>Descrição <span>(opcional)</span><textarea formControlName="description" rows="2"></textarea></label>
              @if (message()) { <p class="alert" [class.success]="message().startsWith('Lançamento')">{{ message() }}</p> }
              <button class="button primary" type="submit" [disabled]="recordForm.invalid">Salvar lançamento</button>
            </form>
          </article>
          <article class="panel wide">
            <div class="panel-title"><div><p class="eyebrow">Histórico</p><h2>Últimos lançamentos</h2></div></div>
            @if (records().length) {
              <div class="activity-list">
                @for (item of reversedRecords(); track item.id) {
                  <div class="activity"><span class="activity-icon">{{ icon(item.type) }}</span><div><strong>{{ label(item.type) }} · {{ item.ticker }}</strong><small>{{ item.date | date:'dd/MM/yyyy':'UTC' }}</small></div><b>{{ item.totalValue ? (item.totalValue | currency:'BRL') : (item.quantity | number:'1.0-6') }}</b></div>
                }
              </div>
            } @else { <p class="empty-copy">Nenhum lançamento nesta carteira.</p> }
          </article>
        </section>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly wallets = signal<Wallet[]>([]);
  readonly assets = signal<Asset[]>([]);
  readonly selectedWalletId = signal('');
  readonly dashboard = signal<Dashboard | null>(null);
  readonly records = signal<LedgerItem[]>([]);
  readonly showWalletForm = signal(false);
  readonly message = signal('');
  readonly userName = signal(localStorage.getItem('mad_user') ?? 'Investidor');
  readonly userInitial = computed(() => this.userName().charAt(0).toUpperCase());
  readonly reversedRecords = computed(() => [...this.records()].reverse().slice(0, 12));
  readonly walletForm = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(80)]] });
  readonly recordForm = this.fb.group({
    type: this.fb.nonNullable.control('COMPRA', Validators.required),
    assetId: this.fb.nonNullable.control('', Validators.required),
    date: this.fb.nonNullable.control(new Date().toISOString().slice(0, 10), Validators.required),
    quantity: this.fb.control<number | null>(null),
    totalValue: this.fb.control<number | null>(null),
    newQuantity: this.fb.control<number | null>(null),
    ratio: this.fb.nonNullable.control(''),
    description: this.fb.nonNullable.control('')
  });
  readonly recordTypes = [
    { value: 'COMPRA', label: 'Compra' }, { value: 'VENDA', label: 'Venda' },
    { value: 'SUBSCRICAO', label: 'Subscrição' }, { value: 'DIVIDENDO', label: 'Dividendo' },
    { value: 'JCP', label: 'JCP' }, { value: 'BONIFICACAO', label: 'Bonificação' },
    { value: 'DESDOBRAMENTO', label: 'Desdobramento' }, { value: 'GRUPAMENTO', label: 'Grupamento' }
  ];

  ngOnInit(): void {
    this.api.assets().subscribe((assets) => this.assets.set(assets));
    this.loadWallets();
  }
  loadWallets(): void {
    this.api.wallets().subscribe((wallets) => {
      this.wallets.set(wallets);
      if (wallets.length && !this.selectedWalletId()) this.selectWallet(wallets[0].id);
    });
  }
  selectWallet(id: string): void {
    this.selectedWalletId.set(id);
    if (!id) return;
    this.api.dashboard(id).subscribe((data) => this.dashboard.set(data));
    this.api.records(id).subscribe((items) => this.records.set(items));
  }
  createWallet(): void {
    if (this.walletForm.invalid) return;
    this.api.createWallet(this.walletForm.getRawValue().name).subscribe((wallet) => {
      this.walletForm.reset(); this.showWalletForm.set(false); this.loadWallets(); this.selectWallet(wallet.id);
    });
  }
  createRecord(): void {
    const walletId = this.selectedWalletId();
    if (!walletId || this.recordForm.invalid) return;
    const value = this.recordForm.getRawValue();
    const body = Object.fromEntries(Object.entries({ ...value, walletId }).filter(([, field]) => field !== null && field !== ''));
    this.api.createRecord(body).subscribe({
      next: () => {
        this.message.set('Lançamento salvo com sucesso.');
        this.recordForm.patchValue({ quantity: null, totalValue: null, newQuantity: null, ratio: '', description: '' });
        this.selectWallet(walletId);
      },
      error: (response) => this.message.set(response.error?.message ?? 'Não foi possível salvar o lançamento.')
    });
  }
  isIncome(): boolean { return ['DIVIDENDO', 'JCP'].includes(this.recordForm.controls.type.value); }
  isBonus(): boolean { return this.recordForm.controls.type.value === 'BONIFICACAO'; }
  isCorporateEvent(): boolean { return ['DESDOBRAMENTO', 'GRUPAMENTO'].includes(this.recordForm.controls.type.value); }
  icon(type: string): string { return ['COMPRA', 'SUBSCRICAO', 'BONIFICACAO'].includes(type) ? '+' : type === 'VENDA' ? '−' : '•'; }
  label(type: string): string { return this.recordTypes.find((item) => item.value === type)?.label ?? type; }
  logout(): void { localStorage.clear(); void this.router.navigate(['/login']); }
}

