import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { SessionService } from '../core/session.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <header class="topbar"><a class="brand dark" routerLink="/"><span>M</span> MAD</a><a routerLink="/">Voltar</a></header>
    <main class="narrow-page">
      <p class="eyebrow">Sua conta</p><h1>Perfil</h1>
      <section class="panel">
        <form [formGroup]="form" (ngSubmit)="save()" class="stack-single">
          <label>Nome<input formControlName="name"></label>
          <label>E-mail<input formControlName="email" type="email"></label>
          @if (message()) { <p class="notice">{{ message() }}</p> }
          <button class="button primary" [disabled]="form.invalid">Salvar perfil</button>
        </form>
      </section>
      <section class="panel danger-zone">
        <h2>Excluir conta</h2><p>Carteiras, lançamentos e notas serão removidos definitivamente.</p>
        <button class="button danger-button" (click)="remove()">Excluir minha conta</button>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly message = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]]
  });
  ngOnInit(): void {
    this.api.profile().subscribe(profile => this.form.setValue({ name: profile.name, email: profile.email }));
  }
  save(): void {
    if (this.form.invalid) return;
    this.api.updateProfile(this.form.getRawValue()).subscribe(profile => {
      localStorage.setItem('mad_user', profile.name);
      this.message.set('Perfil atualizado com sucesso.');
    });
  }
  remove(): void {
    if (!window.confirm('Excluir definitivamente sua conta e todos os dados?')) return;
    this.api.deleteProfile().subscribe(() => { this.session.clear(); void this.router.navigate(['/login']); });
  }
}
