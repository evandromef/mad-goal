import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Asset, IncomeResponse } from '../../core/api.service';
import { RecordFormComponent } from '../../shared/record-form/record-form.component';

@Component({
  selector: 'app-incomes',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RecordFormComponent, RouterLink],
  templateUrl: './incomes.component.html',
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
