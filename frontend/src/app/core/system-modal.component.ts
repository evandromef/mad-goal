import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, HostListener, inject, signal } from '@angular/core';
import { ModalService, ModalState } from './modal.service';

@Component({
  selector: 'app-system-modal',
  template: `
    @if (modal.state(); as state) {
      <div class="modal-backdrop" (mousedown)="cancel()">
        <section class="system-modal" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId"
          (mousedown)="$event.stopPropagation()">
          <div class="modal-mark" [class.danger]="state.danger">{{ state.danger ? '!' : 'M' }}</div>
          <div class="modal-copy">
            <p class="eyebrow">MAD · Confirmação</p>
            <h2 [id]="titleId">{{ state.title }}</h2>
            <p>{{ state.message }}</p>
          </div>
          @if (state.inputLabel) {
            <label>{{ state.inputLabel }}
              <input data-modal-initial-focus [value]="inputValue()" [placeholder]="state.placeholder ?? ''"
                (input)="inputValue.set($any($event.target).value)" (keydown.enter)="confirm()">
            </label>
          }
          <div class="modal-actions">
            <button data-modal-initial-focus class="button secondary" type="button" (click)="cancel()">
              {{ state.cancelLabel }}
            </button>
            <button class="button" [class.primary]="!state.danger" [class.danger-button]="state.danger"
              type="button" (click)="confirm()" [disabled]="!!state.inputLabel && !inputValue().trim()">
              {{ state.confirmLabel }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SystemModalComponent {
  readonly modal = inject(ModalService);
  readonly inputValue = signal('');
  readonly titleId = 'system-modal-title';
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private openState: ModalState | null = null;

  constructor() {
    effect(() => {
      const state = this.modal.state();
      this.inputValue.set(state?.initialValue ?? '');

      if (state && state !== this.openState) {
        this.openState = state;
        queueMicrotask(() => {
          if (this.modal.state() === state) this.focusInitialControl();
        });
      } else if (!state && this.openState) {
        const returnFocus = this.openState.returnFocus;
        this.openState = null;
        queueMicrotask(() => {
          if (!this.modal.state() && returnFocus?.isConnected) returnFocus.focus();
        });
      }
    });
  }

  confirm(): void {
    const state = this.modal.state();
    if (!state || (state.inputLabel && !this.inputValue().trim())) return;
    state.onConfirm(this.inputValue().trim());
  }

  cancel(): void { this.modal.state()?.onCancel(); }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.modal.state()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
      return;
    }
    if (event.key !== 'Tab') return;

    const controls = this.focusableControls();
    if (!controls.length) {
      event.preventDefault();
      return;
    }
    const current = this.document.activeElement;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (current === first || !controls.includes(current as HTMLElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (current === last || !controls.includes(current as HTMLElement))) {
      event.preventDefault();
      first.focus();
    }
  }

  @HostListener('document:focusin', ['$event'])
  onFocusIn(event: FocusEvent): void {
    const dialog = this.dialog();
    if (this.modal.state() && dialog && !dialog.contains(event.target as Node)) this.focusInitialControl();
  }

  private focusInitialControl(): void {
    this.dialog()?.querySelector<HTMLElement>('[data-modal-initial-focus]')?.focus();
  }

  private focusableControls(): HTMLElement[] {
    return Array.from(this.dialog()?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    ) ?? []);
  }

  private dialog(): HTMLElement | null {
    return this.element.nativeElement.querySelector<HTMLElement>('[role="dialog"]');
  }
}
