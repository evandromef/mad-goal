import { Directive } from '@angular/core';

@Directive({
  selector: '[appMotionOverlay]',
  exportAs: 'motionOverlay',
  host: { '(animationstart)': 'onAnimationStart($event)' }
})
export class MotionOverlayDirective {
  onAnimationStart(event: AnimationEvent): void {
    const isSupportedLeave = event.animationName === 'motion-fade-out'
      || event.animationName === 'motion-menu-out';
    if (!isSupportedLeave || !(event.currentTarget instanceof HTMLElement)) return;
    this.deactivate(event.currentTarget);
  }

  deactivate(overlay: HTMLElement): void {
    overlay.inert = true;
    overlay.setAttribute('aria-hidden', 'true');
  }
}
