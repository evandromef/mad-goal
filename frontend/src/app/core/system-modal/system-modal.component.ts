import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { ModalService, ModalState } from '../modal.service';
import { MotionOverlayDirective } from '../motion-overlay.directive';

@Component({
  selector: 'app-system-modal',
  imports: [MotionOverlayDirective],
  templateUrl: './system-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemModalComponent {
  readonly modal = inject(ModalService);
  readonly inputValue = signal('');
  readonly titleId = 'system-modal-title';
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private openState: ModalState | null = null;
  @ViewChild(MotionOverlayDirective) private motionOverlay?: MotionOverlayDirective;

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
    this.deactivateOverlay();
    state.onConfirm(this.inputValue().trim());
  }

  cancel(): void {
    const state = this.modal.state();
    if (!state) return;
    this.deactivateOverlay();
    state.onCancel();
  }

  private deactivateOverlay(): void {
    const overlay = this.element.nativeElement.querySelector<HTMLElement>('.modal-backdrop');
    if (overlay) this.motionOverlay?.deactivate(overlay);
  }

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
    return Array.from(
      this.dialog()?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
  }

  private dialog(): HTMLElement | null {
    return this.element.nativeElement.querySelector<HTMLElement>('[role="dialog"]');
  }
}
