import { Directive, ElementRef, inject, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appMotionOverlay]',
  exportAs: 'motionOverlay',
  host: { '(animationstart)': 'onAnimationStart($event)' },
})
export class MotionOverlayDirective implements OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnDestroy(): void {
    this.deactivate(this.elementRef.nativeElement);
  }

  onAnimationStart(event: AnimationEvent): void {
    const isSupportedLeave =
      event.animationName === 'motion-fade-out' ||
      event.animationName === 'motion-menu-out' ||
      event.animationName === 'motion-field-out';
    if (!isSupportedLeave || event.target !== event.currentTarget || !(event.currentTarget instanceof HTMLElement))
      return;
    this.deactivate(event.currentTarget);
  }

  deactivate(overlay: HTMLElement): void {
    overlay.inert = true;
    overlay.setAttribute('aria-hidden', 'true');
  }
}
