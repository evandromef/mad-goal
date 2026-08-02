import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, AuthResponse } from '../../core/api.service';
import { SessionService } from '../../core/session.service';

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize(config: { client_id: string; callback: (value: { credential: string }) => void }): void;
      renderButton(element: HTMLElement, options: Record<string, string>): void;
    } } };
  }
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly mode = signal<'login' | 'register' | 'confirm' | 'forgot' | 'reset'>('login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = this.fb.nonNullable.group({
    name: [''], email: ['', [Validators.email]], password: [''], accountToken: ['']
  });

  ngOnInit(): void {
    const requestedMode = this.route.snapshot.queryParamMap.get('mode');
    const token = this.route.snapshot.queryParamMap.get('token');
    if ((requestedMode === 'confirm' || requestedMode === 'reset') && token) {
      this.mode.set(requestedMode);
      this.form.controls.accountToken.setValue(token);
    }
  }

  ngAfterViewInit(): void {
    this.api.authConfig().subscribe(({ googleClientId }) => {
      if (!googleClientId) return;
      const initialize = () => {
        const element = document.getElementById('google-button');
        if (!window.google || !element) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: ({ credential }) => this.googleLogin(credential)
        });
        window.google.accounts.id.renderButton(element, { theme: 'outline', size: 'large', width: '350' });
      };
      window.google ? initialize() : setTimeout(initialize, 800);
    });
  }

  eyebrow(): string {
    return ({ login: 'Bem-vindo de volta', register: 'Comece agora', confirm: 'Confirme seu cadastro',
      forgot: 'Recupere o acesso', reset: 'Crie uma nova senha' })[this.mode()];
  }
  title(): string {
    return ({ login: 'Acesse sua carteira', register: 'Crie sua conta', confirm: 'Confirme seu e-mail',
      forgot: 'Esqueci minha senha', reset: 'Redefinir senha' })[this.mode()];
  }
  actionLabel(): string {
    return ({ login: 'Entrar', register: 'Criar conta', confirm: 'Confirmar e entrar',
      forgot: 'Gerar instruções', reset: 'Salvar nova senha' })[this.mode()];
  }
  submit(): void {
    const { name, email, password, accountToken } = this.form.getRawValue();
    this.loading.set(true); this.error.set(''); this.message.set('');
    const mode = this.mode();
    if (mode === 'login') {
      this.api.login({ email, password }).subscribe(this.authObserver());
    } else if (mode === 'register') {
      this.api.register({ name, email, password }).subscribe({
        next: (response) => {
          this.loading.set(false); this.mode.set('confirm'); this.message.set(response.message);
          if (response.verificationToken) this.form.controls.accountToken.setValue(response.verificationToken);
        }, error: (response) => this.fail(response)
      });
    } else if (mode === 'confirm') {
      this.api.confirmEmail(accountToken).subscribe(this.authObserver());
    } else if (mode === 'forgot') {
      this.api.forgotPassword(email).subscribe({
        next: (response) => {
          this.loading.set(false); this.mode.set('reset'); this.message.set(response.message);
          if (response.verificationToken) this.form.controls.accountToken.setValue(response.verificationToken);
        }, error: (response) => this.fail(response)
      });
    } else {
      this.api.resetPassword(accountToken, password).subscribe({
        next: ({ message }) => { this.loading.set(false); this.mode.set('login'); this.message.set(message); },
        error: (response) => this.fail(response)
      });
    }
  }

  setMode(mode: 'login' | 'register' | 'confirm' | 'forgot' | 'reset'): void {
    this.mode.set(mode); this.error.set(''); this.message.set('');
  }
  private googleLogin(credential: string): void {
    this.loading.set(true);
    this.api.googleLogin(credential).subscribe(this.authObserver());
  }
  private authObserver() {
    return {
      next: (response: AuthResponse) => {
        this.session.save(response);
        void this.router.navigate(['/']);
      },
      error: (response: { error?: { message?: string } }) => this.fail(response)
    };
  }
  private fail(response: { error?: { message?: string } }): void {
    this.error.set(response.error?.message ?? 'Não foi possível continuar.');
    this.loading.set(false);
  }
}
