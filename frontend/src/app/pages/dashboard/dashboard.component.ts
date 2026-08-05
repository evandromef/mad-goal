import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Asset, Dashboard, IncomeResponse, LedgerItem, Wallet } from '../../core/api.service';
import { SessionService } from '../../core/session.service';
import { ModalService } from '../../core/modal.service';
import { MotionOverlayDirective } from '../../core/motion-overlay.directive';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, DatePipe, RouterLink, MotionOverlayDirective],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);
  private readonly modal = inject(ModalService);
  private readonly injector = inject(Injector);
  readonly wallets = signal<Wallet[]>([]);
  readonly assets = signal<Asset[]>([]);
  readonly selectedWalletId = signal('');
  readonly dashboard = signal<Dashboard | null>(null);
  readonly records = signal<LedgerItem[]>([]);
  readonly showWalletForm = signal(false);
  readonly walletActionsOpen = signal(false);
  readonly recordModalOpen = signal(false);
  readonly message = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<string | null>(null);
  readonly granularity = signal<'MONTHLY' | 'YEARLY'>('MONTHLY');
  readonly incomeData = signal<IncomeResponse | null>(null);
  readonly incomeMonths = this.createIncomeMonths();
  readonly selectedIncomeMonth = signal(this.incomeMonths[0]);
  readonly selectedMonthIncomes = computed(
    () => this.incomeData()?.items.filter((item) => item.date.startsWith(this.selectedIncomeMonth())) ?? [],
  );
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  private recordModalReturnFocus?: HTMLElement;
  readonly userName = signal(localStorage.getItem('mad_user') ?? 'Investidor');
  readonly userInitial = computed(() => this.userName().charAt(0).toUpperCase());
  readonly recentRecords = computed(() => [...this.records()].reverse().slice(0, 10));
  readonly visibleEvolution = computed(() => [...(this.dashboard()?.evolution.slice(-24) ?? [])].reverse());
  readonly purchaseAssetQuery = signal('');
  readonly filteredPurchaseAssets = computed(() => {
    const query = this.purchaseAssetQuery().trim().toLocaleLowerCase('pt-BR');
    if (!query) return this.assets();
    return this.assets().filter((asset) => this.assetDisplay(asset).toLocaleLowerCase('pt-BR').includes(query));
  });
  availableAssets(): Asset[] {
    if (this.recordForm.controls.type.value === 'COMPRA') return this.assets();
    const walletAssetIds = new Set(this.records().map((item) => item.assetId));
    return this.assets().filter((asset) => walletAssetIds.has(asset.id));
  }
  readonly walletForm = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(80)]] });
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
    description: this.fb.nonNullable.control(''),
  });
  readonly recordTypes = [
    { value: 'COMPRA', label: 'Compra' },
    { value: 'VENDA', label: 'Venda' },
    { value: 'SUBSCRICAO', label: 'Subscrição' },
    { value: 'DIVIDENDO', label: 'Dividendo' },
    { value: 'JCP', label: 'JCP' },
    { value: 'BONIFICACAO', label: 'Bonificação' },
    { value: 'DESDOBRAMENTO', label: 'Desdobramento' },
    { value: 'GRUPAMENTO', label: 'Grupamento' },
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
        this.selectWallet(wallets.some((item) => item.id === requested) ? requested! : wallets[0].id);
        const asset = this.route.snapshot.queryParamMap.get('asset');
        const type = this.route.snapshot.queryParamMap.get('type');
        if (asset) this.recordForm.controls.assetId.setValue(asset);
        if (type && this.recordTypes.some((item) => item.value === type)) this.recordForm.controls.type.setValue(type);
        this.syncPurchaseAssetQuery();
      }
    });
  }
  selectWallet(id: string): void {
    this.closeWalletActions();
    if (id !== this.selectedWalletId()) {
      this.cancelEdit(false);
      this.selectedIncomeMonth.set(this.incomeMonths[0]);
    }
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
  toggleWalletActions(): void {
    if (this.walletActionsOpen()) this.closeWalletActions();
    else this.walletActionsOpen.set(true);
  }
  async openWalletCreation(): Promise<void> {
    this.closeWalletActions();
    if (!this.wallets().length) {
      this.showWalletForm.set(true);
      return;
    }
    this.walletActionsTrigger?.nativeElement.focus();
    const name = (
      await this.modal.prompt({
        title: 'Nova carteira',
        message: 'Escolha um nome para identificar a nova carteira.',
        inputLabel: 'Nome da carteira',
        placeholder: 'Ex.: Longo prazo',
        confirmLabel: 'Criar carteira',
      })
    )?.trim();
    if (name) this.submitWalletCreation(name);
  }
  async renameWallet(): Promise<void> {
    this.closeWalletActions();
    this.walletActionsTrigger?.nativeElement.focus();
    const wallet = this.wallets().find((item) => item.id === this.selectedWalletId());
    if (!wallet) return;
    const name = (
      await this.modal.prompt({
        title: 'Renomear carteira',
        message: `Escolha um novo nome para “${wallet.name}”.`,
        inputLabel: 'Novo nome',
        initialValue: wallet.name,
        placeholder: 'Nome da carteira',
        confirmLabel: 'Salvar nome',
      })
    )?.trim();
    if (!name) return;
    this.api.updateWallet(wallet.id, name).subscribe(() => {
      this.showSuccess('Carteira atualizada.');
      this.loadWallets();
    });
  }
  async deleteWallet(): Promise<void> {
    this.closeWalletActions();
    this.walletActionsTrigger?.nativeElement.focus();
    const id = this.selectedWalletId();
    const wallet = this.wallets().find((item) => item.id === id);
    if (
      !id ||
      !(await this.modal.confirm({
        title: 'Excluir carteira?',
        message: `A carteira “${wallet?.name ?? ''}” e todo o histórico dela serão removidos definitivamente.`,
        confirmLabel: 'Excluir carteira',
        cancelLabel: 'Manter carteira',
        danger: true,
      }))
    )
      return;
    this.api.deleteWallet(id).subscribe(() => {
      this.selectedWalletId.set('');
      this.dashboard.set(null);
      this.records.set([]);
      this.loadWallets();
    });
  }
  @ViewChild('walletActions') private walletActions?: ElementRef<HTMLElement>;
  @ViewChild('walletActionsTrigger') private walletActionsTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('walletActionsMotion') private walletActionsMotion?: MotionOverlayDirective;
  @ViewChild('recordModal') private recordModal?: ElementRef<HTMLElement>;
  @ViewChild('recordModalMotion') private recordMotionOverlay?: MotionOverlayDirective;

  @HostListener('document:click', ['$event'])
  closeWalletActionsOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (this.walletActionsOpen() && (!target || !this.walletActions?.nativeElement.contains(target))) {
      this.closeWalletActions();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  closeOverlaysOnEscape(event: Event): void {
    if (this.recordModalOpen()) {
      event.preventDefault();
      this.cancelEdit();
      return;
    }
    if (!this.walletActionsOpen()) return;
    event.preventDefault();
    this.closeWalletActions(true);
  }
  private submitWalletCreation(name: string): void {
    this.api.createWallet(name).subscribe((wallet) => {
      this.walletForm.reset();
      this.showWalletForm.set(false);
      this.loadWallets();
      this.selectWallet(wallet.id);
    });
  }
  changeGranularity(value: 'MONTHLY' | 'YEARLY'): void {
    this.granularity.set(value);
    this.selectWallet(this.selectedWalletId());
  }
  loadIncomes(): void {
    const walletId = this.selectedWalletId();
    if (!walletId) return;
    const currentMonth = this.incomeMonths[0];
    const [year, month] = currentMonth.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    this.api
      .incomes(walletId, {
        from: `${this.incomeMonths[11]}-01`,
        to: `${currentMonth}-${String(lastDay).padStart(2, '0')}`,
        groupBy: 'MONTHLY',
      })
      .subscribe((data) => this.incomeData.set(data));
  }
  selectIncomeMonth(month: string): void {
    this.selectedIncomeMonth.set(month);
  }
  evolutionWidth(value: number): number {
    const max = Math.max(...this.visibleEvolution().map((item) => item.acquisitionCost), 1);
    return Math.max(2, (value / max) * 100);
  }
  periodLabel(period: string): string {
    const month = /^(\d{4})-(\d{2})$/.exec(period);
    if (month) {
      const monthIndex = Number(month[2]) - 1;
      if (monthIndex >= 0 && monthIndex <= 11) {
        return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
          new Date(Date.UTC(Number(month[1]), monthIndex, 1)),
        );
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
    if (selectedAssetId && !this.availableAssets().some((asset) => asset.id === selectedAssetId)) {
      this.recordForm.controls.assetId.setValue('');
    }
  }
  assetDisplay(asset: Asset): string {
    return `${asset.ticker} · ${asset.name}`;
  }
  onPurchaseAssetInput(value: string): void {
    this.purchaseAssetQuery.set(value);
    const normalized = value.trim().toLocaleLowerCase('pt-BR');
    const selected = this.assets().find(
      (asset) =>
        asset.ticker.toLocaleLowerCase('pt-BR') === normalized ||
        this.assetDisplay(asset).toLocaleLowerCase('pt-BR') === normalized,
    );
    this.recordForm.controls.assetId.setValue(selected?.id ?? '');
  }
  selectFirstPurchaseAsset(event: Event): void {
    event.preventDefault();
    const asset = this.filteredPurchaseAssets()[0];
    if (!asset) return;
    this.purchaseAssetQuery.set(this.assetDisplay(asset));
    this.recordForm.controls.assetId.setValue(asset.id);
    this.focusNextRecordControl(event.currentTarget as HTMLElement);
  }
  openRecordModal(): void {
    this.captureRecordModalReturnFocus();
    this.editingId.set(null);
    this.message.set('');
    this.resetRecordForm();
    this.recordModalOpen.set(true);
    this.focusRecordModal();
  }
  saveRecord(): void {
    const walletId = this.selectedWalletId();
    if (!walletId || this.recordForm.invalid) return;
    const body = this.recordPayload(walletId);
    const editingId = this.editingId();
    const request = editingId ? this.api.updateRecord(editingId, body) : this.api.createRecord(body);
    request.subscribe({
      next: () => {
        this.showSuccess(editingId ? 'Lançamento atualizado com sucesso.' : 'Lançamento salvo com sucesso.');
        this.editingId.set(null);
        this.resetRecordForm();
        this.closeRecordModal();
        this.selectWallet(walletId);
      },
      error: (response) => this.showError(response.error?.message ?? 'Não foi possível salvar o lançamento.'),
    });
  }
  editRecord(item: LedgerItem): void {
    this.captureRecordModalReturnFocus();
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
      description: item.description ?? '',
    });
    this.recordForm.controls.assetId.disable();
    this.syncPurchaseAssetQuery();
    this.recordModalOpen.set(true);
    this.focusRecordModal();
  }
  async deleteRecord(item: LedgerItem): Promise<void> {
    if (
      !(await this.modal.confirm({
        title: 'Excluir lançamento?',
        message: `${this.label(item.type)} de ${item.ticker} em ${new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')} será removido do histórico.`,
        confirmLabel: 'Excluir lançamento',
        cancelLabel: 'Manter lançamento',
        danger: true,
      }))
    )
      return;
    this.api.deleteRecord(item.id).subscribe({
      next: () => {
        if (this.editingId() === item.id) this.cancelEdit(false);
        this.showSuccess('Lançamento excluído com sucesso.');
        this.selectWallet(this.selectedWalletId());
      },
      error: (response) => this.showError(response.error?.message ?? 'Não foi possível excluir o lançamento.'),
    });
  }
  cancelEdit(clearMessage = true): void {
    this.editingId.set(null);
    this.resetRecordForm();
    this.closeRecordModal(clearMessage);
    if (clearMessage) {
      this.message.set('');
      this.clearSuccess();
    }
  }
  trapRecordModalFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const controls = this.recordModalControls();
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
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
  private createIncomeMonths(): string[] {
    const now = new Date();
    return Array.from({ length: 12 }, (_, offset) => {
      const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() - offset, 1));
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    });
  }
  private captureRecordModalReturnFocus(): void {
    const activeElement = document.activeElement;
    this.recordModalReturnFocus = activeElement instanceof HTMLElement ? activeElement : undefined;
  }
  private focusRecordModal(): void {
    afterNextRender(
      () => {
        const initialControl = Array.from(
          this.recordModal?.nativeElement.querySelectorAll<HTMLElement>('[data-record-initial-focus]') ?? [],
        ).find((control) => !control.matches(':disabled') && !control.closest('[inert]'));
        (
          initialControl ?? this.recordModal?.nativeElement.querySelector<HTMLElement>('select[formControlName="type"]')
        )?.focus();
      },
      { injector: this.injector },
    );
  }
  private focusNextRecordControl(currentControl: HTMLElement): void {
    const controls = this.recordModalControls();
    const currentIndex = controls.indexOf(currentControl);
    if (currentIndex >= 0) controls[currentIndex + 1]?.focus();
  }
  private recordModalControls(): HTMLElement[] {
    return Array.from(
      this.recordModal?.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((control) => !control.closest('[inert]'));
  }
  private closeRecordModal(restoreFocus = true): void {
    if (!this.recordModalOpen()) return;
    const overlay = this.recordModal?.nativeElement.parentElement;
    if (overlay) this.recordMotionOverlay?.deactivate(overlay);
    this.recordModalOpen.set(false);
    if (restoreFocus) {
      const returnFocus = this.recordModalReturnFocus;
      queueMicrotask(() => returnFocus?.focus());
    }
    this.recordModalReturnFocus = undefined;
  }
  private closeWalletActions(restoreFocus = false): void {
    if (!this.walletActionsOpen()) return;
    const menu = this.walletActions?.nativeElement.querySelector<HTMLElement>('.wallet-actions-menu');
    if (menu) this.walletActionsMotion?.deactivate(menu);
    this.walletActionsOpen.set(false);
    if (restoreFocus) this.walletActionsTrigger?.nativeElement.focus();
  }
  private recordPayload(walletId: string): Record<string, unknown> {
    const value = this.recordForm.getRawValue();
    const payload: Record<string, unknown> = {
      walletId,
      assetId: value.assetId,
      type: value.type,
      date: value.date,
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
      description: '',
    });
    this.purchaseAssetQuery.set('');
  }
  private syncPurchaseAssetQuery(): void {
    const selected = this.assets().find((asset) => asset.id === this.recordForm.controls.assetId.value);
    this.purchaseAssetQuery.set(selected ? this.assetDisplay(selected) : '');
  }
  isOperation(): boolean {
    return this.isOperationType(this.recordForm.controls.type.value);
  }
  isOperationType(type: string): boolean {
    return ['COMPRA', 'VENDA', 'SUBSCRICAO'].includes(type);
  }
  isIncome(): boolean {
    return ['DIVIDENDO', 'JCP'].includes(this.recordForm.controls.type.value);
  }
  isBonus(): boolean {
    return this.recordForm.controls.type.value === 'BONIFICACAO';
  }
  isCorporateEvent(): boolean {
    return ['DESDOBRAMENTO', 'GRUPAMENTO'].includes(this.recordForm.controls.type.value);
  }
  typeInitial(type: string): string {
    return this.label(type).charAt(0).toUpperCase();
  }
  label(type: string): string {
    return this.recordTypes.find((item) => item.value === type)?.label ?? type;
  }
  logout(): void {
    this.session.clear();
  }
}
