import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, LedgerItem, Note, Position } from '../core/api.service';

@Component({
  selector: 'app-asset-detail',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink],
  template: `
    <header class="topbar"><a class="brand dark" routerLink="/"><span>M</span> MAD</a><a routerLink="/">Voltar à carteira</a></header>
    <main class="workspace">
      @if (position(); as item) {
        <section class="hero-row"><div><p class="eyebrow">{{ item.category }}</p><h1>{{ item.ticker }}</h1><p>{{ item.name }}</p></div>
          <div class="context-actions">
            <a class="button primary" [routerLink]="['/']" [queryParams]="context('COMPRA')">Compra</a>
            <a class="button secondary" [routerLink]="['/']" [queryParams]="context('VENDA')">Venda</a>
            <a class="button secondary" [routerLink]="['/']" [queryParams]="context('SUBSCRICAO')">Subscrição</a>
            <a class="button secondary" [routerLink]="['/']" [queryParams]="context('DIVIDENDO')">Provento</a>
            <a class="button secondary" [routerLink]="['/']" [queryParams]="context('BONIFICACAO')">Bonificação</a>
            <a class="button secondary" [routerLink]="['/']" [queryParams]="context('DESDOBRAMENTO')">Desdobramento</a>
            <a class="button secondary" [routerLink]="['/']" [queryParams]="context('GRUPAMENTO')">Grupamento</a>
          </div>
        </section>
        <section class="metrics detail-metrics">
          <article class="metric"><span>Quantidade</span><strong>{{ item.quantity | number:'1.0-8' }}</strong></article>
          <article class="metric"><span>Custo</span><strong>{{ item.acquisitionCost | currency:'BRL' }}</strong></article>
          <article class="metric"><span>Cotação</span><strong>{{ item.currentPrice == null ? 'Indisponível' : (item.currentPrice | currency:'BRL') }}</strong><small>Preço unitário</small></article>
          <article class="metric"><span>Data da cotação</span><strong>{{ item.priceDate == null ? 'Indisponível' : (item.priceDate | date:'dd/MM/yyyy':'UTC') }}</strong><small>Última referência válida</small></article>
          <article class="metric"><span>Valor atual</span><strong>{{ item.currentValue == null ? 'Indisponível' : (item.currentValue | currency:'BRL') }}</strong></article>
          <article class="metric"><span>Resultado (P&amp;L)</span><strong [class.negative]="item.profitLoss != null && item.profitLoss < 0">{{ item.profitLoss == null ? 'Indisponível' : (item.profitLoss | currency:'BRL') }}</strong></article>
          <article class="metric"><span>Rentabilidade</span><strong>{{ item.returnPercentage == null ? 'Indisponível' : ((item.returnPercentage | number:'1.2-2') + '%') }}</strong></article>
          <article class="metric"><span>Alocação</span><strong>{{ item.allocationPercentage == null ? 'Indisponível' : ((item.allocationPercentage | number:'1.2-2') + '%') }}</strong></article>
        </section>
      }
      <section class="content-grid">
        <article class="panel wide">
          <div class="panel-title"><div><p class="eyebrow">Auditoria</p><h2>Histórico do ativo</h2></div>
            <select class="compact-select" [value]="filter()" (change)="filter.set($any($event.target).value)">
              <option value="TODOS">Todos</option><option value="OPERACOES">Operações</option>
              <option value="PROVENTOS">Proventos</option><option value="EVENTOS">Eventos</option>
            </select>
          </div>
          @for (item of filteredRecords(); track item.id) {
            <div class="activity">
              <span class="activity-icon">•</span>
              <div><strong>{{ item.type }}</strong><small>{{ item.date | date:'dd/MM/yyyy':'UTC' }}</small></div>
              <b>{{ historyValue(item) }}</b>
            </div>
          } @empty { <p class="empty-copy">Nenhum lançamento neste filtro.</p> }
        </article>
        <aside class="panel">
          <p class="eyebrow">Anotações</p><h2>Notas pessoais</h2>
          <form [formGroup]="noteForm" (ngSubmit)="saveNote()">
            <label>Conteúdo<textarea formControlName="content" rows="4"></textarea></label>
            <div class="form-actions"><button class="button primary" [disabled]="noteForm.invalid">{{ editingNote() ? 'Salvar' : 'Adicionar' }}</button>
              @if (editingNote()) { <button class="button secondary" type="button" (click)="cancelNote()">Cancelar</button> }</div>
          </form>
          <div class="notes-list">
            @for (note of notes(); track note.id) {
              <article class="note"><p>{{ note.content }}</p><small>{{ note.updatedAt | date:'dd/MM/yyyy HH:mm' }}</small>
                <div class="activity-actions"><button (click)="editNote(note)">Editar</button><button class="danger" (click)="deleteNote(note)">Excluir</button></div>
              </article>
            }
          </div>
        </aside>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly walletId = this.route.snapshot.paramMap.get('walletId') ?? '';
  readonly assetId = this.route.snapshot.paramMap.get('assetId') ?? '';
  readonly position = signal<Position | null>(null);
  readonly records = signal<LedgerItem[]>([]);
  readonly notes = signal<Note[]>([]);
  readonly filter = signal<'TODOS' | 'OPERACOES' | 'PROVENTOS' | 'EVENTOS'>('TODOS');
  readonly editingNote = signal<Note | null>(null);
  readonly noteForm = this.fb.nonNullable.group({ content: ['', [Validators.required, Validators.maxLength(2000)]] });
  readonly filteredRecords = computed(() => this.records().filter(item => {
    const type = this.filter();
    if (type === 'TODOS') return true;
    if (type === 'PROVENTOS') return ['DIVIDENDO', 'JCP'].includes(item.type);
    if (type === 'EVENTOS') return ['BONIFICACAO', 'DESDOBRAMENTO', 'GRUPAMENTO'].includes(item.type);
    return ['COMPRA', 'VENDA', 'SUBSCRICAO'].includes(item.type);
  }).reverse());

  ngOnInit(): void {
    this.api.dashboard(this.walletId).subscribe(data =>
      this.position.set(data.positions.find(item => item.assetId === this.assetId) ?? null));
    this.api.records(this.walletId).subscribe(items => this.records.set(items.filter(item => item.assetId === this.assetId)));
    this.loadNotes();
  }
  context(type: string): { wallet: string; asset: string; type: string } {
    return { wallet: this.walletId, asset: this.assetId, type };
  }
  historyValue(item: LedgerItem): string {
    if (item.totalValue != null) return item.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (item.newQuantity != null) return `${item.newQuantity} un. · ${item.ratio ?? 'sem proporção'}`;
    return `${item.quantity ?? 0} un.`;
  }
  saveNote(): void {
    const content = this.noteForm.getRawValue().content;
    const current = this.editingNote();
    const body = { walletId: this.walletId, assetId: this.assetId, content };
    (current ? this.api.updateNote(current.id, body) : this.api.createNote(body)).subscribe(() => {
      this.cancelNote(); this.loadNotes();
    });
  }
  editNote(note: Note): void { this.editingNote.set(note); this.noteForm.setValue({ content: note.content }); }
  cancelNote(): void { this.editingNote.set(null); this.noteForm.reset(); }
  deleteNote(note: Note): void {
    if (window.confirm('Excluir esta nota?')) this.api.deleteNote(note.id).subscribe(() => this.loadNotes());
  }
  private loadNotes(): void { this.api.notes(this.walletId, this.assetId).subscribe(items => this.notes.set(items)); }
}
