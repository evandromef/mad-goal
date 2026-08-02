import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalService } from './core/modal.service';
import { SystemModalComponent } from './core/system-modal.component';
import { ThemeToggleComponent } from './core/theme-toggle.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SystemModalComponent, ThemeToggleComponent],
  template: `
    <div class="route-content" [attr.inert]="modal.state() ? '' : null"><router-outlet /></div>
    <app-theme-toggle />
    <app-system-modal />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly modal = inject(ModalService);
}
