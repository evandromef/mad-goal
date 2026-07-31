import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Asset, Dashboard, IncomeResponse, LedgerItem, Wallet } from '../core/api.service';
import { SessionService } from '../core/session.service';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, DatePipe, RouterLink],
  template: `
    <header class="topbar">
      <a class="brand dark" href="/"><span>M</span> MAD</a>
      <nav><a href="#posicoes">Posições</a><a href="#lancamentos">Lançamentos</a></nav>
      <div class="user"><span>{{ userInitial() }}</span><a routerLink="/profile">Perfil</a><button class="text-button" (click)="logout()">Sair</button></div>
    </header>
    @if (successMessage()) {
      <div class="success-toast" role="status" aria-live="polite">{{ successMessage() }}</div>
    }
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
              @for (wallet of wallets(); track wallet.id) { <option [value]="wallet.id">{{ wallet.name }} · {{ wallet.currentValue == null ? 'indisponível' : (wallet.currentValue | currency:'BRL') }}</option> }
            </select>
          </label>
          <button class="button secondary" (click)="showWalletForm.set(!showWalletForm())">+ Carteira</button>
          @if (selectedWalletId()) {
            <button class="button secondary" (click)="renameWallet()">Renomear</button>
            <button class="button danger-button" (click)="deleteWallet()">Excluir</button>
          }
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
          <article class="metric featured"><span>Patrimônio atual</span><strong>{{ data.currentValue == null ? 'Indisponível' : (data.currentValue | currency:'BRL') }}</strong><small>Última posição consolidada</small></article>
          <article class="metric"><span>Custo de aquisição</span><strong>{{ data.acquisitionCost | currency:'BRL' }}</strong><small>Capital alocado</small></article>
          <article class="metric"><span>Resultado</span><strong [class.negative]="data.profitLoss != null && data.profitLoss < 0">{{ data.profitLoss == null ? 'Indisponível' : (data.profitLoss | currency:'BRL') }}</strong><small>{{ data.returnPercentage == null ? 'Rentabilidade indisponível' : ((data.returnPercentage | number:'1.2-2') + '% de rentabilidade') }}</small></article>
          <article class="metric"><span>Proventos</span><strong>{{ data.totalIncome | currency:'BRL' }}</strong><small>Recebidos no histórico</small></article>
        </section>

        <section class="content-grid" id="posicoes">
          <article class="panel wide">
            <div class="panel-title"><div><p class="eyebrow">Composição</p><h2>Posições da carteira</h2></div><span class="chip">{{ data.positions.length }} ativos</span></div>
            @if (data.positions.length) {
              <div class="table-scroll"><table>
                <thead><tr><th>Ativo</th><th>Qtd.</th><th>Custo</th><th>Valor atual</th><th>Resultado</th><th>Rentabilidade</th><th>Alocação</th></tr></thead>
                <tbody>
                  @for (position of data.positions; track position.assetId) {
                    <tr>
                      <td><a [routerLink]="['/assets', selectedWalletId(), position.assetId]"><strong>{{ position.ticker }}</strong></a><small>{{ position.category === 'ACAO' ? 'Ação' : 'FII' }}</small></td>
                      <td>{{ position.quantity | number:'1.0-8' }}</td>
                      <td>{{ position.acquisitionCost | currency:'BRL' }}</td>
                      <td>{{ position.currentValue == null ? 'Indisponível' : (position.currentValue | currency:'BRL') }}</td>
                      <td [class.negative]="position.profitLoss != null && position.profitLoss < 0">{{ position.profitLoss == null ? 'Indisponível' : (position.profitLoss | currency:'BRL') }}</td>
                      <td>{{ position.returnPercentage == null ? 'Indisponível' : ((position.returnPercentage | number:'1.2-2') + '%') }}</td>
                      <td><div class="allocation"><i [style.width.%]="position.allocationPercentage ?? 0"></i></div>{{ position.allocationPercentage == null ? '—' : ((position.allocationPercentage | number:'1.2-2') + '%') }}</td>
                    </tr>
                  }
                </tbody>
              </table></div>
            } @else { <p class="empty-copy">Registre uma compra para começar a acompanhar sua posição.</p> }
          </article>
          <aside class="panel">
            <p class="eyebrow">Distribuição</p><h2>Por categoria</h2>
            @for (category of data.categories; track category.category) {
              <div class="category-row"><span>{{ category.category === 'ACAO' ? 'Ações' : 'FIIs' }}</span><strong>{{ category.allocationPercentage == null ? '—' : ((category.allocationPercentage | number:'1.2-2') + '%') }}</strong></div>
              <div class="category-details"><small>Custo {{ category.acquisitionCost | currency:'BRL' }}</small><small>Atual {{ category.currentValue == null ? 'indisponível' : (category.currentValue | currency:'BRL') }}</small><small>Retorno {{ category.returnPercentage == null ? 'indisponível' : ((category.returnPercentage | number:'1.2-2') + '%') }}</small></div>
              <div class="allocation large"><i [style.width.%]="category.allocationPercentage ?? 0"></i></div>
            }
            <div class="highlight"><span>Maior posição</span><strong>{{ data.largestPosition ?? '—' }}</strong></div>
          </aside>
        </section>

        <section class="content-grid" id="lancamentos">
          <article class="panel">
            <p class="eyebrow">{{ editingId() ? 'Editando registro' : 'Novo registro' }}</p>
            <h2>{{ editingId() ? 'Editar lançamento' : 'Adicionar lançamento' }}</h2>
            <form [formGroup]="recordForm" (ngSubmit)="saveRecord()" class="stack-form">
              <div class="form-row">
                <label>Tipo<select formControlName="type" (change)="onRecordTypeChange()">
                  @for (type of recordTypes; track type.value) { <option [value]="type.value">{{ type.label }}</option> }
                </select></label>
                <label>Ativo<select formControlName="assetId" [class.readonly]="editingId()"><option value="">Selecione</option>
                  @for (asset of availableAssets(); track asset.id) { <option [value]="asset.id">{{ asset.ticker }} · {{ asset.name }}</option> }
                </select></label>
              </div>
              <div class="form-row">
                <label>Data<input type="date" formControlName="date"></label>
                @if (isCorporateEvent()) {
                  <label>Nova quantidade<input type="number" min="0.000001" step="0.000001" formControlName="newQuantity"></label>
                } @else if (isIncome()) {
                  <label class="total-value income-total-value">Valor total<input type="number" min="0.01" step="0.01" formControlName="totalValue"></label>
                } @else {
                  <label>Quantidade<input type="number" min="0.000001" step="0.000001" formControlName="quantity"></label>
                }
              </div>
              @if (isCorporateEvent()) {
                <div class="form-row"><label>Proporção<input formControlName="ratio" placeholder="Ex.: 1:2"></label></div>
              } @else {
                @if (isOperation()) {
                  <div class="form-row"><label class="total-value">Valor total<input type="number" min="0.01" step="0.01" formControlName="totalValue"></label></div>
                }
                @if (!isBonus()) {
                  <div class="form-row">
                    <label>Preço unitário <span>(opcional)</span><input type="number" min="0" step="0.01" formControlName="unitPrice"></label>
                    @if (isOperation()) { <label>Taxas <span>(opcional)</span><input type="number" min="0" step="0.01" formControlName="fees"></label> }
                  </div>
                }
              }
              <label class="record-description">Descrição <span>(opcional)</span><textarea formControlName="description" rows="2"></textarea></label>
              <div class="form-actions">
                <button class="button primary" type="submit" [disabled]="recordForm.invalid">
                  {{ editingId() ? 'Salvar alterações' : 'Salvar lançamento' }}
                </button>
                @if (editingId()) { <button class="button secondary" type="button" (click)="cancelEdit()">Cancelar</button> }
              </div>
              <div class="form-message-slot" aria-live="polite">
                @if (message()) { <p class="alert">{{ message() }}</p> }
              </div>
            </form>
          </article>
          <article class="panel wide">
            <div class="panel-title"><div><p class="eyebrow">Histórico completo</p><h2>Lançamentos</h2></div></div>
            @if (records().length) {
              <div class="activity-list">
                @for (item of reversedRecords(); track item.id) {
                  <div class="activity" [class.editing]="editingId() === item.id">
                    <span class="activity-icon">{{ icon(item.type) }}</span>
                    <div><strong>{{ label(item.type) }} · {{ item.ticker }}</strong><small>{{ item.date | date:'dd/MM/yyyy':'UTC' }}</small></div>
                    <b>{{ recordValue(item) }}</b>
                    <div class="activity-actions">
                      <button type="button" (click)="editRecord(item)" aria-label="Editar lançamento">Editar</button>
                      <button class="danger" type="button" (click)="deleteRecord(item)" aria-label="Excluir lançamento">Excluir</button>
                    </div>
                  </div>
                }
              </div>
            } @else { <p class="empty-copy">Nenhum lançamento nesta carteira.</p> }
          </article>
        </section>

        <section class="content-grid analytics">
          <article class="panel">
            <div class="panel-title"><div><p class="eyebrow">Evolução</p><h2>Custo de aquisição</h2></div>
              <select class="compact-select" [value]="granularity()" (change)="changeGranularity($any($event.target).value)">
                <option value="MONTHLY">Mensal</option><option value="YEARLY">Anual</option>
              </select>
            </div>
            <div class="evolution">
              @for (point of visibleEvolution(); track point.period) {
                <div><span>{{ periodLabel(point.period) }}</span><i [style.width.%]="evolutionWidth(point.acquisitionCost)"></i><strong>{{ point.acquisitionCost | currency:'BRL' }}</strong></div>
              } @empty { <p class="empty-copy">Sem dados de evolução.</p> }
            </div>
          </article>
          <article class="panel">
            <p class="eyebrow">Proventos</p><h2>Análise por período</h2>
            <form [formGroup]="incomeForm" class="filter-grid" (ngSubmit)="loadIncomes()">
              <label>Ativo<select formControlName="assetId"><option value="">Todos</option>
                @for (asset of incomeAssets(); track asset.id) { <option [value]="asset.id">{{ asset.ticker }}</option> }
              </select></label>
              <label>Categoria<select formControlName="category"><option value="">Todas</option><option value="ACAO">Ações</option><option value="FII">FIIs</option></select></label>
              <label>Tipo<select formControlName="type"><option value="">Todos</option><option value="DIVIDENDO">Dividendos</option><option value="JCP">JCP</option></select></label>
              <label>De<input type="date" formControlName="from"></label><label>Até<input type="date" formControlName="to"></label>
              <label>Agrupar<select formControlName="groupBy"><option value="MONTHLY">Mensal</option><option value="QUARTERLY">Trimestral</option><option value="YEARLY">Anual</option></select></label>
              <button class="button secondary">Aplicar</button>
            </form>
            @if (incomeData(); as income) {
              <p class="income-total">Total filtrado <strong>{{ income.total | currency:'BRL' }}</strong></p>
              @for (group of income.groups; track group.period) {
                <div class="category-row"><span>{{ periodLabel(group.period) }}</span><strong>{{ group.total | currency:'BRL' }}</strong></div>
              }
              <div class="table-scroll income-history"><table>
                <thead><tr><th>Data</th><th>Ativo</th><th>Tipo</th><th>Valor</th></tr></thead>
                <tbody>
                  @for (item of income.items; track item.id) {
                    <tr><td>{{ item.date | date:'dd/MM/yyyy':'UTC' }}</td><td>{{ item.ticker }}</td><td>{{ label(item.type) }}</td><td>{{ item.totalValue | currency:'BRL' }}</td></tr>
                  }
                </tbody>
              </table></div>
              @if (!income.items.length) { <p class="empty-copy compact">Nenhum provento encontrado.</p> }
            }
          </article>
        </section>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);
  readonly wallets = signal<Wallet[]>([]);
  readonly assets = signal<Asset[]>([]);
  readonly selectedWalletId = signal('');
  readonly dashboard = signal<Dashboard | null>(null);
  readonly records = signal<LedgerItem[]>([]);
  readonly showWalletForm = signal(false);
  readonly message = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<string | null>(null);
  readonly granularity = signal<'MONTHLY' | 'YEARLY'>('MONTHLY');
  readonly incomeData = signal<IncomeResponse | null>(null);
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  readonly userName = signal(localStorage.getItem('mad_user') ?? 'Investidor');
  readonly userInitial = computed(() => this.userName().charAt(0).toUpperCase());
  readonly reversedRecords = computed(() => [...this.records()].reverse());
  readonly visibleEvolution = computed(() => [...(this.dashboard()?.evolution.slice(-24) ?? [])].reverse());
  readonly incomeAssets = computed(() => {
    const ids = new Set(this.records().map(item => item.assetId));
    return this.assets().filter(asset => ids.has(asset.id));
  });
  availableAssets(): Asset[] {
    if (this.recordForm.controls.type.value === 'COMPRA') return this.assets();
    const walletAssetIds = new Set(this.records().map(item => item.assetId));
    return this.assets().filter(asset => walletAssetIds.has(asset.id));
  }
  readonly walletForm = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(80)]] });
  readonly incomeForm = this.fb.nonNullable.group({ assetId: '', category: '', type: '', from: '', to: '', groupBy: 'MONTHLY' });
  readonly recordForm = this.fb.group({
    type: this.fb.nonNullable.control('COMPRA', Validators.required),
    assetId: this.fb.nonNullable.control('', Validators.required),
    date: this.fb.nonNullable.control(new Date().toISOString().slice(0, 10), Validators.required),
    quantity: this.fb.control<number | null>(null),
    unitPrice: this.fb.control<number | null>(null),
    fees: this.fb.control<number | null>(null),
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
  ngOnDestroy(): void {
    if (this.successTimer) clearTimeout(this.successTimer);
  }
  loadWallets(): void {
    this.api.wallets().subscribe((wallets) => {
      this.wallets.set(wallets);
      if (wallets.length && !this.selectedWalletId()) {
        const requested = this.route.snapshot.queryParamMap.get('wallet');
        this.selectWallet(wallets.some(item => item.id === requested) ? requested! : wallets[0].id);
        const asset = this.route.snapshot.queryParamMap.get('asset');
        const type = this.route.snapshot.queryParamMap.get('type');
        if (asset) this.recordForm.controls.assetId.setValue(asset);
        if (type && this.recordTypes.some(item => item.value === type)) this.recordForm.controls.type.setValue(type);
      }
    });
  }
  selectWallet(id: string): void {
    if (id !== this.selectedWalletId()) this.cancelEdit(false);
    this.selectedWalletId.set(id);
    if (!id) return;
    this.api.dashboard(id, this.granularity()).subscribe((data) => this.dashboard.set(data));
    this.api.records(id).subscribe((items) => this.records.set(items));
    this.loadIncomes();
  }
  createWallet(): void {
    if (this.walletForm.invalid) return;
    this.api.createWallet(this.walletForm.getRawValue().name).subscribe((wallet) => {
      this.walletForm.reset(); this.showWalletForm.set(false); this.loadWallets(); this.selectWallet(wallet.id);
    });
  }
  renameWallet(): void {
    const wallet = this.wallets().find(item => item.id === this.selectedWalletId());
    const name = wallet && window.prompt('Novo nome da carteira:', wallet.name)?.trim();
    if (!wallet || !name) return;
    this.api.updateWallet(wallet.id, name).subscribe(() => {
      this.showSuccess('Carteira atualizada.');
      this.loadWallets();
    });
  }
  deleteWallet(): void {
    const id = this.selectedWalletId();
    if (!id || !window.confirm('Excluir esta carteira e todo o histórico?')) return;
    this.api.deleteWallet(id).subscribe(() => {
      this.selectedWalletId.set('');
      this.dashboard.set(null);
      this.records.set([]);
      this.loadWallets();
    });
  }
  changeGranularity(value: 'MONTHLY' | 'YEARLY'): void {
    this.granularity.set(value);
    this.selectWallet(this.selectedWalletId());
  }
  loadIncomes(): void {
    const walletId = this.selectedWalletId();
    if (!walletId) return;
    const filters = Object.fromEntries(Object.entries(this.incomeForm.getRawValue()).filter(([, value]) => value));
    this.api.incomes(walletId, filters).subscribe(data => this.incomeData.set(data));
  }
  evolutionWidth(value: number): number {
    const max = Math.max(...this.visibleEvolution().map(item => item.acquisitionCost), 1);
    return Math.max(2, value / max * 100);
  }
  periodLabel(period: string): string {
    const month = /^(\d{4})-(\d{2})$/.exec(period);
    if (month) {
      const monthIndex = Number(month[2]) - 1;
      if (monthIndex >= 0 && monthIndex <= 11) {
        return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
          .format(new Date(Date.UTC(Number(month[1]), monthIndex, 1)));
      }
    }
    const quarter = /^(\d{4})-T([1-4])$/.exec(period);
    if (quarter) return `${quarter[2]}º trimestre de ${quarter[1]}`;
    return period;
  }
  recordValue(item: LedgerItem): string {
    if (item.totalValue != null) {
      return item.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (item.newQuantity != null) return `${item.newQuantity} un. · ${item.ratio ?? 'sem proporção'}`;
    return `${item.quantity ?? 0} un.`;
  }
  onRecordTypeChange(): void {
    const selectedAssetId = this.recordForm.controls.assetId.value;
    if (selectedAssetId && !this.availableAssets().some(asset => asset.id === selectedAssetId)) {
      this.recordForm.controls.assetId.setValue('');
    }
  }
  saveRecord(): void {
    const walletId = this.selectedWalletId();
    if (!walletId || this.recordForm.invalid) return;
    const body = this.recordPayload(walletId);
    const editingId = this.editingId();
    const request = editingId
      ? this.api.updateRecord(editingId, body)
      : this.api.createRecord(body);
    request.subscribe({
      next: () => {
        this.showSuccess(editingId ? 'Lançamento atualizado com sucesso.' : 'Lançamento salvo com sucesso.');
        this.editingId.set(null);
        this.resetRecordForm();
        this.selectWallet(walletId);
      },
      error: (response) => this.showError(response.error?.message ?? 'Não foi possível salvar o lançamento.')
    });
  }
  editRecord(item: LedgerItem): void {
    this.editingId.set(item.id);
    this.message.set('');
    this.clearSuccess();
    this.recordForm.reset({
      type: item.type,
      assetId: item.assetId,
      date: item.date,
      quantity: item.quantity ?? null,
      unitPrice: item.unitPrice ?? null,
      fees: item.fees ?? null,
      totalValue: item.totalValue ?? null,
      newQuantity: item.newQuantity ?? null,
      ratio: item.ratio ?? '',
      description: item.description ?? ''
    });
    this.recordForm.controls.assetId.disable();
    document.getElementById('lancamentos')?.scrollIntoView({ behavior: 'smooth' });
  }
  deleteRecord(item: LedgerItem): void {
    if (!window.confirm(`Excluir o lançamento ${this.label(item.type)} de ${item.ticker}?`)) return;
    this.api.deleteRecord(item.id).subscribe({
      next: () => {
        if (this.editingId() === item.id) this.cancelEdit(false);
        this.showSuccess('Lançamento excluído com sucesso.');
        this.selectWallet(this.selectedWalletId());
      },
      error: (response) => this.showError(response.error?.message ?? 'Não foi possível excluir o lançamento.')
    });
  }
  cancelEdit(clearMessage = true): void {
    this.editingId.set(null);
    this.resetRecordForm();
    if (clearMessage) {
      this.message.set('');
      this.clearSuccess();
    }
  }
  private showSuccess(message: string): void {
    this.message.set('');
    this.clearSuccess();
    this.successMessage.set(message);
    this.successTimer = setTimeout(() => {
      this.successMessage.set('');
      this.successTimer = null;
    }, 3500);
  }
  private showError(message: string): void {
    this.clearSuccess();
    this.message.set(message);
  }
  private clearSuccess(): void {
    if (this.successTimer) clearTimeout(this.successTimer);
    this.successTimer = null;
    this.successMessage.set('');
  }
  private recordPayload(walletId: string): Record<string, unknown> {
    const value = this.recordForm.getRawValue();
    const payload: Record<string, unknown> = {
      walletId, assetId: value.assetId, type: value.type, date: value.date
    };
    if (value.description) payload['description'] = value.description;
    if (this.isOperation() || this.isIncome()) {
      if (value.totalValue !== null) payload['totalValue'] = value.totalValue;
      if (value.unitPrice !== null) payload['unitPrice'] = value.unitPrice;
    }
    if (this.isOperation()) {
      if (value.quantity !== null) payload['quantity'] = value.quantity;
      if (value.fees !== null) payload['fees'] = value.fees;
    }
    if (this.isBonus() && value.quantity !== null) payload['quantity'] = value.quantity;
    if (this.isCorporateEvent()) {
      if (value.newQuantity !== null) payload['newQuantity'] = value.newQuantity;
      if (value.ratio) payload['ratio'] = value.ratio;
    }
    return payload;
  }
  private resetRecordForm(): void {
    this.recordForm.controls.assetId.enable({ emitEvent: false });
    this.recordForm.reset({
      type: 'COMPRA',
      assetId: '',
      date: new Date().toISOString().slice(0, 10),
      quantity: null,
      unitPrice: null,
      fees: null,
      totalValue: null,
      newQuantity: null,
      ratio: '',
      description: ''
    });
  }
  isOperation(): boolean { return ['COMPRA', 'VENDA', 'SUBSCRICAO'].includes(this.recordForm.controls.type.value); }
  isIncome(): boolean { return ['DIVIDENDO', 'JCP'].includes(this.recordForm.controls.type.value); }
  isBonus(): boolean { return this.recordForm.controls.type.value === 'BONIFICACAO'; }
  isCorporateEvent(): boolean { return ['DESDOBRAMENTO', 'GRUPAMENTO'].includes(this.recordForm.controls.type.value); }
  icon(type: string): string { return ['COMPRA', 'SUBSCRICAO', 'BONIFICACAO'].includes(type) ? '+' : type === 'VENDA' ? '−' : '•'; }
  label(type: string): string { return this.recordTypes.find((item) => item.value === type)?.label ?? type; }
  logout(): void { this.session.clear(); }
}
