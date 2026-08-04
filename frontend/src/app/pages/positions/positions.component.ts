import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Dashboard } from '../../core/api.service';
import { RecordFormComponent } from '../../shared/record-form/record-form.component';

@Component({
  selector: 'app-positions',
  imports: [CurrencyPipe, DecimalPipe, RecordFormComponent, RouterLink],
  templateUrl: './positions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  readonly walletId = this.route.snapshot.paramMap.get('walletId') ?? '';
  readonly walletName = signal('');
  readonly dashboard = signal<Dashboard | null>(null);
  readonly categoryFilter = signal<'TODOS' | 'ACAO' | 'FII'>('TODOS');
  readonly filteredPositions = computed(() => {
    const positions = this.dashboard()?.positions ?? [];
    const category = this.categoryFilter();
    return category === 'TODOS' ? positions : positions.filter(position => position.category === category);
  });
  readonly positionRecordTypes = ['COMPRA', 'VENDA', 'SUBSCRICAO', 'BONIFICACAO', 'DESDOBRAMENTO', 'GRUPAMENTO'];

  ngOnInit(): void {
    this.loadDashboard();
    this.api.wallets().subscribe(wallets =>
      this.walletName.set(wallets.find(wallet => wallet.id === this.walletId)?.name ?? ''));
  }
  loadDashboard(): void { this.api.dashboard(this.walletId).subscribe(data => this.dashboard.set(data)); }
}
