import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, LedgerItem, Note, Position } from '../../core/api.service';
import { ModalService } from '../../core/modal.service';

@Component({
  selector: 'app-asset-detail',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './asset-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly modal = inject(ModalService);
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
  async deleteNote(note: Note): Promise<void> {
    if (await this.modal.confirm({
      title: 'Excluir nota?',
      message: 'Esta anotação pessoal será removida definitivamente do histórico do ativo.',
      confirmLabel: 'Excluir nota',
      cancelLabel: 'Manter nota',
      danger: true
    })) this.api.deleteNote(note.id).subscribe(() => this.loadNotes());
  }
  private loadNotes(): void { this.api.notes(this.walletId, this.assetId).subscribe(items => this.notes.set(items)); }
}
