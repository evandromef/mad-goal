import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button class="theme-toggle" type="button" (click)="theme.toggle()"
      [attr.aria-label]="theme.theme() === 'orbital' ? 'Ativar tema claro' : 'Ativar tema orbital'"
      [attr.aria-pressed]="theme.theme() === 'orbital'">
      <span class="theme-toggle-icon" aria-hidden="true"></span>
      <span class="theme-toggle-label">{{ theme.theme() === 'orbital' ? 'Tema claro' : 'Tema orbital' }}</span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
