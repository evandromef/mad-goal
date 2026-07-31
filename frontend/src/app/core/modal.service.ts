import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface PromptModalOptions extends ConfirmModalOptions {
  inputLabel: string;
  initialValue?: string;
  placeholder?: string;
}

export interface ModalState extends ConfirmModalOptions {
  inputLabel?: string;
  initialValue?: string;
  placeholder?: string;
  returnFocus?: HTMLElement;
  onConfirm(value: string): void;
  onCancel(): void;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly state = signal<ModalState | null>(null);
  private readonly document = inject(DOCUMENT);

  confirm(options: ConfirmModalOptions): Promise<boolean> {
    this.dismissCurrent();
    return new Promise(resolve => this.state.set({
      ...options,
      returnFocus: this.focusedElement(),
      confirmLabel: options.confirmLabel ?? 'Confirmar',
      cancelLabel: options.cancelLabel ?? 'Cancelar',
      onConfirm: () => { this.state.set(null); resolve(true); },
      onCancel: () => { this.state.set(null); resolve(false); }
    }));
  }

  prompt(options: PromptModalOptions): Promise<string | null> {
    this.dismissCurrent();
    return new Promise(resolve => this.state.set({
      ...options,
      returnFocus: this.focusedElement(),
      confirmLabel: options.confirmLabel ?? 'Salvar',
      cancelLabel: options.cancelLabel ?? 'Cancelar',
      onConfirm: value => { this.state.set(null); resolve(value); },
      onCancel: () => { this.state.set(null); resolve(null); }
    }));
  }

  private dismissCurrent(): void {
    this.state()?.onCancel();
  }

  private focusedElement(): HTMLElement | undefined {
    const element = this.document.activeElement;
    return element instanceof HTMLElement ? element : undefined;
  }
}
