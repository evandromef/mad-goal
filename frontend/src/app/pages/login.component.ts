import { AfterViewInit, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, AuthResponse } from '../core/api.service';
import { SessionService } from '../core/session.service';

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
  template: `
    <main class="auth-shell">
      <section class="auth-story">
        <a class="brand" href="/"><span>M</span> MAD</a>
        <div><p class="eyebrow">Patrimônio sem ruído</p>
          <h1>Seus ativos.<br><em>Uma visão clara.</em></h1>
          <p class="lede">Acompanhe custo, posição e proventos de ações e FIIs em uma experiência simples e direta.</p>
        </div>
        <p class="fine">Meus Ativos Digitais · Controle pessoal de investimentos</p>
      </section>
      <section class="auth-panel">
        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-card">
          <p class="eyebrow">{{ eyebrow() }}</p><h2>{{ title() }}</h2>
          @if (mode() === 'register') {
            <label>Nome<input formControlName="name" autocomplete="name" placeholder="Seu nome"></label>
          }
          @if (mode() === 'login' || mode() === 'register' || mode() === 'forgot') {
            <label>E-mail<input formControlName="email" type="email" autocomplete="email" placeholder="voce@email.com"></label>
          }
          @if (mode() === 'login' || mode() === 'register' || mode() === 'reset') {
            <label>Senha<input formControlName="password" type="password" autocomplete="current-password" placeholder="Mínimo de 8 caracteres"></label>
          }
          @if (mode() === 'confirm' || mode() === 'reset') {
            <label>Token<input formControlName="accountToken" autocomplete="one-time-code" placeholder="Token recebido"></label>
          }
          @if (message()) { <p class="notice">{{ message() }}</p> }
          @if (error()) { <p class="alert">{{ error() }}</p> }
          <button class="button primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Aguarde…' : actionLabel() }}
          </button>
          @if (mode() === 'login') {
            <button class="text-button" type="button" (click)="setMode('forgot')">Esqueci minha senha</button>
            <div id="google-button" class="google-button"></div>
            <button class="text-button" type="button" (click)="setMode('register')">Ainda não tem conta? Cadastre-se</button>
          } @else {
            <button class="text-button" type="button" (click)="setMode('login')">Voltar para o login</button>
          }
        </form>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  readonly mode = signal<'login' | 'register' | 'confirm' | 'forgot' | 'reset'>('login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = this.fb.nonNullable.group({
    name: [''], email: ['', [Validators.email]], password: [''], accountToken: ['']
  });

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
