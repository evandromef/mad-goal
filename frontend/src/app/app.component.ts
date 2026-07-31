import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalService } from './core/modal.service';
import { SystemModalComponent } from './core/system-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SystemModalComponent],
  template: `
    <div class="route-content" [attr.inert]="modal.state() ? '' : null"><router-outlet /></div>
    <app-system-modal />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly modal = inject(ModalService);
}
