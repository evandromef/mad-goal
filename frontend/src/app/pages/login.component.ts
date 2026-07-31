import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="auth-shell">
      <section class="auth-story">
        <a class="brand" href="/"><span>M</span> MAD</a>
        <div>
          <p class="eyebrow">Patrimônio sem ruído</p>
          <h1>Seus ativos.<br><em>Uma visão clara.</em></h1>
          <p class="lede">Acompanhe custo, posição e proventos de ações e FIIs em uma experiência simples e direta.</p>
        </div>
        <p class="fine">Meus Ativos Digitais · Controle pessoal de investimentos</p>
      </section>
      <section class="auth-panel">
        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-card">
          <p class="eyebrow">{{ registering() ? 'Comece agora' : 'Bem-vindo de volta' }}</p>
          <h2>{{ registering() ? 'Crie sua conta' : 'Acesse sua carteira' }}</h2>
          @if (registering()) {
            <label>Nome<input formControlName="name" autocomplete="name" placeholder="Seu nome"></label>
          }
          <label>E-mail<input formControlName="email" type="email" autocomplete="email" placeholder="voce@email.com"></label>
          <label>Senha<input formControlName="password" type="password" autocomplete="current-password" placeholder="Mínimo de 8 caracteres"></label>
          @if (error()) { <p class="alert">{{ error() }}</p> }
          <button class="button primary" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Aguarde…' : (registering() ? 'Criar conta' : 'Entrar') }}
          </button>
          <button class="text-button" type="button" (click)="toggle()">
            {{ registering() ? 'Já possui conta? Entrar' : 'Ainda não tem conta? Cadastre-se' }}
          </button>
        </form>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly registering = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  toggle(): void {
    this.registering.update((value) => !value);
    this.error.set('');
  }
  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set('');
    const { name, email, password } = this.form.getRawValue();
    const request = this.registering() ? this.api.register({ name, email, password }) : this.api.login({ email, password });
    request.subscribe({
      next: (response) => {
        localStorage.setItem('mad_token', response.token);
        localStorage.setItem('mad_user', response.name);
        void this.router.navigate(['/']);
      },
      error: (response) => {
        this.error.set(response.error?.message ?? 'Não foi possível continuar.');
        this.loading.set(false);
      }
    });
  }
}

