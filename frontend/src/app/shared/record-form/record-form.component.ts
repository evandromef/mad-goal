import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Asset, LedgerItem } from '../../core/api.service';

export const RECORD_TYPES = [
  { value: 'COMPRA', label: 'Compra' },
  { value: 'VENDA', label: 'Venda' },
  { value: 'SUBSCRICAO', label: 'Subscrição' },
  { value: 'DIVIDENDO', label: 'Dividendo' },
  { value: 'JCP', label: 'JCP' },
  { value: 'BONIFICACAO', label: 'Bonificação' },
  { value: 'DESDOBRAMENTO', label: 'Desdobramento' },
  { value: 'GRUPAMENTO', label: 'Grupamento' },
];

@Component({
  selector: 'app-record-form',
  imports: [ReactiveFormsModule],
  templateUrl: './record-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordFormComponent implements OnInit {
  @Input({ required: true }) walletId = '';
  @Input() allowedTypes: string[] | null = null;
  @Input() initialType = 'COMPRA';
  @Output() readonly saved = new EventEmitter<LedgerItem>();
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly assets = signal<Asset[]>([]);
  readonly records = signal<LedgerItem[]>([]);
  readonly purchaseAssetQuery = signal('');
  readonly message = signal('');
  readonly success = signal(false);
  readonly saving = signal(false);
  readonly visibleRecordTypes = computed(() =>
    this.allowedTypes?.length ? RECORD_TYPES.filter((type) => this.allowedTypes!.includes(type.value)) : RECORD_TYPES,
  );
  readonly filteredPurchaseAssets = computed(() => {
    const query = this.purchaseAssetQuery().trim().toLocaleLowerCase('pt-BR');
    return query
      ? this.assets().filter((asset) => this.assetDisplay(asset).toLocaleLowerCase('pt-BR').includes(query))
      : this.assets();
  });
  readonly form = this.fb.group({
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

  ngOnInit(): void {
    const initial = this.visibleRecordTypes().some((type) => type.value === this.initialType)
      ? this.initialType
      : (this.visibleRecordTypes()[0]?.value ?? 'COMPRA');
    this.form.controls.type.setValue(initial);
    this.configureValidators();
    this.api.assets().subscribe((assets) => this.assets.set(assets));
    this.reloadRecords();
  }

  availableAssets(): Asset[] {
    if (this.form.controls.type.value === 'COMPRA') return this.assets();
    const ids = new Set(this.records().map((item) => item.assetId));
    return this.assets().filter((asset) => ids.has(asset.id));
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
    this.form.controls.assetId.setValue(selected?.id ?? '');
  }
  onTypeChange(): void {
    this.message.set('');
    this.configureValidators();
    if (this.form.controls.type.value !== 'COMPRA') {
      this.purchaseAssetQuery.set('');
      const selected = this.form.controls.assetId.value;
      if (selected && !this.availableAssets().some((asset) => asset.id === selected)) {
        this.form.controls.assetId.setValue('');
      }
    }
  }
  isOperation(): boolean {
    return ['COMPRA', 'VENDA', 'SUBSCRICAO'].includes(this.form.controls.type.value);
  }
  isIncome(): boolean {
    return ['DIVIDENDO', 'JCP'].includes(this.form.controls.type.value);
  }
  isBonus(): boolean {
    return this.form.controls.type.value === 'BONIFICACAO';
  }
  isCorporateEvent(): boolean {
    return ['DESDOBRAMENTO', 'GRUPAMENTO'].includes(this.form.controls.type.value);
  }

  save(): void {
    if (!this.walletId || this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.message.set('');
    this.api.createRecord(this.payload()).subscribe({
      next: (item) => {
        this.saving.set(false);
        this.success.set(true);
        this.message.set('Lançamento salvo com sucesso.');
        this.reset();
        this.reloadRecords();
        this.saved.emit(item);
      },
      error: (response) => {
        this.saving.set(false);
        this.success.set(false);
        this.message.set(response.error?.message ?? 'Não foi possível salvar o lançamento.');
      },
    });
  }

  private configureValidators(): void {
    const positive = [Validators.required, Validators.min(0.000001)];
    this.form.controls.quantity.setValidators(this.isOperation() || this.isBonus() ? positive : []);
    this.form.controls.totalValue.setValidators(
      this.isOperation() || this.isIncome() ? [Validators.required, Validators.min(0.01)] : [],
    );
    this.form.controls.newQuantity.setValidators(this.isCorporateEvent() ? positive : []);
    for (const control of [
      this.form.controls.quantity,
      this.form.controls.totalValue,
      this.form.controls.newQuantity,
    ]) {
      control.updateValueAndValidity({ emitEvent: false });
    }
  }
  private payload(): Record<string, unknown> {
    const value = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      walletId: this.walletId,
      assetId: value.assetId,
      type: value.type,
      date: value.date,
    };
    if (value.description) payload['description'] = value.description;
    if ((this.isOperation() || this.isIncome()) && value.totalValue != null) payload['totalValue'] = value.totalValue;
    if ((this.isOperation() || this.isIncome()) && value.unitPrice != null) payload['unitPrice'] = value.unitPrice;
    if ((this.isOperation() || this.isBonus()) && value.quantity != null) payload['quantity'] = value.quantity;
    if (this.isOperation() && value.fees != null) payload['fees'] = value.fees;
    if (this.isCorporateEvent() && value.newQuantity != null) payload['newQuantity'] = value.newQuantity;
    if (this.isCorporateEvent() && value.ratio) payload['ratio'] = value.ratio;
    return payload;
  }
  private reset(): void {
    const type = this.visibleRecordTypes().some((item) => item.value === this.initialType)
      ? this.initialType
      : (this.visibleRecordTypes()[0]?.value ?? 'COMPRA');
    this.form.reset({
      type,
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
    this.configureValidators();
  }
  private reloadRecords(): void {
    if (this.walletId) this.api.records(this.walletId).subscribe((records) => this.records.set(records));
  }
}
