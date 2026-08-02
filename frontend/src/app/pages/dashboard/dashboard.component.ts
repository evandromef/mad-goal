import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Asset, Dashboard, IncomeResponse, LedgerItem, Wallet } from '../../core/api.service';
import { SessionService } from '../../core/session.service';
import { ModalService } from '../../core/modal.service';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);
  private readonly modal = inject(ModalService);
  readonly wallets = signal<Wallet[]>([]);
  readonly assets = signal<Asset[]>([]);
  readonly selectedWalletId = signal('');
  readonly dashboard = signal<Dashboard | null>(null);
  readonly records = signal<LedgerItem[]>([]);
  readonly showWalletForm = signal(false);
  readonly walletActionsOpen = signal(false);
  readonly message = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<string | null>(null);
  readonly granularity = signal<'MONTHLY' | 'YEARLY'>('MONTHLY');
  readonly incomeData = signal<IncomeResponse | null>(null);
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  readonly userName = signal(localStorage.getItem('mad_user') ?? 'Investidor');
  readonly userInitial = computed(() => this.userName().charAt(0).toUpperCase());
  readonly recentRecords = computed(() => [...this.records()].reverse().slice(0, 20));
  readonly visibleEvolution = computed(() => [...(this.dashboard()?.evolution.slice(-24) ?? [])].reverse());
  readonly purchaseAssetQuery = signal('');
  readonly filteredPurchaseAssets = computed(() => {
    const query = this.purchaseAssetQuery().trim().toLocaleLowerCase('pt-BR');
    if (!query) return this.assets();
    return this.assets().filter(asset => this.assetDisplay(asset).toLocaleLowerCase('pt-BR').includes(query));
  });
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
    this.api.assets().subscribe((assets) => {
      this.assets.set(assets);
      this.syncPurchaseAssetQuery();
    });
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
        this.syncPurchaseAssetQuery();
      }
    });
  }
  selectWallet(id: string): void {
    this.walletActionsOpen.set(false);
    if (id !== this.selectedWalletId()) this.cancelEdit(false);
    this.selectedWalletId.set(id);
    if (!id) return;
    this.api.dashboard(id, this.granularity()).subscribe((data) => this.dashboard.set(data));
    this.api.records(id).subscribe((items) => this.records.set(items));
    this.loadIncomes();
  }
  createWallet(): void {
    if (this.walletForm.invalid) return;
    const name = this.walletForm.getRawValue().name.trim();
    if (name) this.submitWalletCreation(name);
  }
  cancelWalletCreation(): void {
    this.walletForm.reset();
    this.showWalletForm.set(false);
  }
  toggleWalletActions(): void { this.walletActionsOpen.update(open => !open); }
  async openWalletCreation(): Promise<void> {
    this.walletActionsOpen.set(false);
    if (!this.wallets().length) {
      this.showWalletForm.set(true);
      return;
    }
    this.walletActionsTrigger?.nativeElement.focus();
    const name = (await this.modal.prompt({
      title: 'Nova carteira',
      message: 'Escolha um nome para identificar a nova carteira.',
      inputLabel: 'Nome da carteira',
      placeholder: 'Ex.: Longo prazo',
      confirmLabel: 'Criar carteira'
    }))?.trim();
    if (name) this.submitWalletCreation(name);
  }
  async renameWallet(): Promise<void> {
    this.walletActionsOpen.set(false);
    this.walletActionsTrigger?.nativeElement.focus();
    const wallet = this.wallets().find(item => item.id === this.selectedWalletId());
    if (!wallet) return;
    const name = (await this.modal.prompt({
      title: 'Renomear carteira',
      message: `Escolha um novo nome para “${wallet.name}”.`,
      inputLabel: 'Novo nome',
      initialValue: wallet.name,
      placeholder: 'Nome da carteira',
      confirmLabel: 'Salvar nome'
    }))?.trim();
    if (!name) return;
    this.api.updateWallet(wallet.id, name).subscribe(() => {
      this.showSuccess('Carteira atualizada.');
      this.loadWallets();
    });
  }
  async deleteWallet(): Promise<void> {
    this.walletActionsOpen.set(false);
    this.walletActionsTrigger?.nativeElement.focus();
    const id = this.selectedWalletId();
    const wallet = this.wallets().find(item => item.id === id);
    if (!id || !await this.modal.confirm({
      title: 'Excluir carteira?',
      message: `A carteira “${wallet?.name ?? ''}” e todo o histórico dela serão removidos definitivamente.`,
      confirmLabel: 'Excluir carteira',
      cancelLabel: 'Manter carteira',
      danger: true
    })) return;
    this.api.deleteWallet(id).subscribe(() => {
      this.selectedWalletId.set('');
      this.dashboard.set(null);
      this.records.set([]);
      this.loadWallets();
    });
  }
  @ViewChild('walletActions') private walletActions?: ElementRef<HTMLElement>;
  @ViewChild('walletActionsTrigger') private walletActionsTrigger?: ElementRef<HTMLButtonElement>;

  @HostListener('document:click', ['$event'])
  closeWalletActionsOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (this.walletActionsOpen() && (!target || !this.walletActions?.nativeElement.contains(target))) {
      this.walletActionsOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  closeWalletActionsOnEscape(event: Event): void {
    if (!this.walletActionsOpen()) return;
    event.preventDefault();
    this.walletActionsOpen.set(false);
    this.walletActionsTrigger?.nativeElement.focus();
  }
  private submitWalletCreation(name: string): void {
    this.api.createWallet(name).subscribe((wallet) => {
      this.walletForm.reset(); this.showWalletForm.set(false); this.loadWallets(); this.selectWallet(wallet.id);
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
  operationDetails(item: LedgerItem): string {
    if (!this.isOperationType(item.type)) return '';
    const details: string[] = [];
    if (item.quantity != null) {
      details.push(`${item.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} un.`);
    }
    if (item.unitPrice != null) {
      const unitPrice = item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      details.push(`Preço unitário ${unitPrice}`);
    }
    return details.join(' · ');
  }
  onRecordTypeChange(): void {
    if (this.recordForm.controls.type.value === 'COMPRA') {
      this.syncPurchaseAssetQuery();
      return;
    }
    const selectedAssetId = this.recordForm.controls.assetId.value;
    if (selectedAssetId && !this.availableAssets().some(asset => asset.id === selectedAssetId)) {
      this.recordForm.controls.assetId.setValue('');
    }
  }
  assetDisplay(asset: Asset): string { return `${asset.ticker} · ${asset.name}`; }
  onPurchaseAssetInput(value: string): void {
    this.purchaseAssetQuery.set(value);
    const normalized = value.trim().toLocaleLowerCase('pt-BR');
    const selected = this.assets().find(asset => asset.ticker.toLocaleLowerCase('pt-BR') === normalized
      || this.assetDisplay(asset).toLocaleLowerCase('pt-BR') === normalized);
    this.recordForm.controls.assetId.setValue(selected?.id ?? '');
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
    this.syncPurchaseAssetQuery();
    document.getElementById('lancamentos')?.scrollIntoView({ behavior: 'smooth' });
  }
  async deleteRecord(item: LedgerItem): Promise<void> {
    if (!await this.modal.confirm({
      title: 'Excluir lançamento?',
      message: `${this.label(item.type)} de ${item.ticker} em ${new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')} será removido do histórico.`,
      confirmLabel: 'Excluir lançamento',
      cancelLabel: 'Manter lançamento',
      danger: true
    })) return;
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
    this.purchaseAssetQuery.set('');
  }
  private syncPurchaseAssetQuery(): void {
    const selected = this.assets().find(asset => asset.id === this.recordForm.controls.assetId.value);
    this.purchaseAssetQuery.set(selected ? this.assetDisplay(selected) : '');
  }
  isOperation(): boolean { return this.isOperationType(this.recordForm.controls.type.value); }
  isOperationType(type: string): boolean { return ['COMPRA', 'VENDA', 'SUBSCRICAO'].includes(type); }
  isIncome(): boolean { return ['DIVIDENDO', 'JCP'].includes(this.recordForm.controls.type.value); }
  isBonus(): boolean { return this.recordForm.controls.type.value === 'BONIFICACAO'; }
  isCorporateEvent(): boolean { return ['DESDOBRAMENTO', 'GRUPAMENTO'].includes(this.recordForm.controls.type.value); }
  typeInitial(type: string): string { return this.label(type).charAt(0).toUpperCase(); }
  label(type: string): string { return this.recordTypes.find((item) => item.value === type)?.label ?? type; }
  logout(): void { this.session.clear(); }
}
