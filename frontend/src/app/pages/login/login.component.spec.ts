import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { SessionService } from '../../core/session.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const auth = { token: 'access', refreshToken: 'refresh', id: 'u1', name: 'Ana', email: 'ana@example.com' };
  const api = {
    authConfig: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    confirmEmail: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    googleLogin: vi.fn(),
  };
  const session = { save: vi.fn() };
  const route = { snapshot: { queryParamMap: convertToParamMap({ mode: 'confirm', token: 'from-link' }) } };
  beforeEach(async () => {
    route.snapshot.queryParamMap = convertToParamMap({ mode: 'confirm', token: 'from-link' });
    vi.clearAllMocks();
    api.authConfig.mockReturnValue(of({ googleClientId: '' }));
    api.login.mockReturnValue(of(auth));
    api.register.mockReturnValue(of({ message: 'Confirme', verificationToken: 'confirmation' }));
    api.confirmEmail.mockReturnValue(of(auth));
    api.forgotPassword.mockReturnValue(of({ message: 'Enviado', verificationToken: 'reset' }));
    api.resetPassword.mockReturnValue(of({ message: 'Redefinida' }));
    api.googleLogin.mockReturnValue(of(auth));
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: SessionService, useValue: session },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  it('abre link de confirmação e conclui autenticação', () => {
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.ngOnInit();
    expect(component.mode()).toBe('confirm');
    expect(component.form.controls.accountToken.value).toBe('from-link');
    component.submit();
    expect(api.confirmEmail).toHaveBeenCalledWith('from-link');
    expect(session.save).toHaveBeenCalledWith(auth);
    expect(component.title()).toContain('Confirme');
    expect(TestBed.inject(Router)).toBeTruthy();
  });
  it('abre link de recuperação com o token preenchido', () => {
    route.snapshot.queryParamMap = convertToParamMap({ mode: 'reset', token: 'reset-from-link' });
    const component = TestBed.createComponent(LoginComponent).componentInstance;

    component.ngOnInit();

    expect(component.mode()).toBe('reset');
    expect(component.form.controls.accountToken.value).toBe('reset-from-link');
    expect(component.title()).toBe('Redefinir senha');
  });
  it('percorre cadastro, recuperação, redefinição e erro de login', () => {
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.form.setValue({ name: 'Ana', email: 'ana@example.com', password: '12345678', accountToken: '' });
    component.setMode('register');
    component.submit();
    expect(component.mode()).toBe('confirm');
    expect(component.form.controls.accountToken.value).toBe('confirmation');
    component.setMode('forgot');
    component.submit();
    expect(component.mode()).toBe('reset');
    expect(component.form.controls.accountToken.value).toBe('reset');
    component.submit();
    expect(component.mode()).toBe('login');
    expect(component.message()).toBe('Redefinida');
    api.login.mockReturnValueOnce(throwError(() => ({ error: { message: 'Inválido' } })));
    component.submit();
    expect(component.error()).toBe('Inválido');
    expect(component.loading()).toBe(false);
    expect(component.eyebrow()).toBeTruthy();
    expect(component.actionLabel()).toBe('Entrar');
  });
  it('inicializa e conclui o login pelo Google quando configurado', () => {
    api.authConfig.mockReturnValue(of({ googleClientId: 'google-client' }));
    let callback: ((value: { credential: string }) => void) | undefined;
    const initialize = vi.fn(
      (config: { callback: (value: { credential: string }) => void }) => (callback = config.callback),
    );
    const renderButton = vi.fn();
    Object.defineProperty(window, 'google', {
      configurable: true,
      value: { accounts: { id: { initialize, renderButton } } },
    });
    vi.spyOn(document, 'getElementById').mockReturnValue(document.createElement('div'));
    const fixture = TestBed.createComponent(LoginComponent);

    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    callback?.({ credential: 'google-token' });

    expect(initialize).toHaveBeenCalled();
    expect(renderButton).toHaveBeenCalled();
    expect(api.googleLogin).toHaveBeenCalledWith('google-token');
    expect(session.save).toHaveBeenCalledWith(auth);
    fixture.nativeElement.remove();
    delete window.google;
  });
});
