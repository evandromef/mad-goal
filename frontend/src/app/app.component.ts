import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalService } from './core/modal.service';
import { SystemModalComponent } from './core/system-modal/system-modal.component';
import { ThemeToggleComponent } from './core/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SystemModalComponent, ThemeToggleComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly modal = inject(ModalService);
}
