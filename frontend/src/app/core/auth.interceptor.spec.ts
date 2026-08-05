import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { SessionService } from './session.service';

describe('authInterceptor', () => {
  const session = { clear: vi.fn(), refresh: vi.fn() };
  let http: HttpClient;
  let controller: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    session.refresh.mockReturnValue(
      of({ token: 'new-access', refreshToken: 'new-refresh', id: 'u', name: 'A', email: 'a@b.com' }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: session },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });
  afterEach(() => controller.verify());
  it('anexa access token e renova uma vez após 401', () => {
    localStorage.setItem('mad_token', 'old');
    localStorage.setItem('mad_refresh_token', 'refresh');
    http.get('/api/profile').subscribe();
    const first = controller.expectOne('/api/profile');
    expect(first.request.headers.get('Authorization')).toBe('Bearer old');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });
    const retry = controller.expectOne('/api/profile');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({});
    expect(session.refresh).toHaveBeenCalledOnce();
  });
  it('limpa sessão em 401 sem refresh e não intercepta erro público', () => {
    http.get('/api/profile').subscribe({ error: () => {} });
    controller.expectOne('/api/profile').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.clear).toHaveBeenCalled();
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    controller.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.clear).toHaveBeenCalledOnce();
  });
  it('trata 403 vazio como sessão rejeitada sem confundir erro de negócio', () => {
    http.get('/api/profile').subscribe({ error: () => {} });
    controller.expectOne('/api/profile').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(session.clear).toHaveBeenCalledOnce();

    http.get('/api/profile').subscribe({ error: () => {} });
    controller
      .expectOne('/api/profile')
      .flush({ message: 'Operação não permitida.' }, { status: 403, statusText: 'Forbidden' });
    expect(session.clear).toHaveBeenCalledOnce();
  });
  it('limpa a sessão quando a renovação é recusada', () => {
    localStorage.setItem('mad_token', 'expirado');
    localStorage.setItem('mad_refresh_token', 'refresh-expirado');
    session.refresh.mockReturnValueOnce(throwError(() => new Error('Refresh recusado')));
    http.get('/api/profile').subscribe({ error: () => {} });
    controller.expectOne('/api/profile').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(session.clear).toHaveBeenCalledOnce();
  });
});
