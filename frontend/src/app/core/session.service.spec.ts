import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { SessionService } from './session.service';

describe('SessionService', () => {
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
  let service: SessionService;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: router }],
    });
    service = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('salva, renova e limpa a sessão', () => {
    localStorage.setItem('mad_refresh_token', 'refresh-antigo');
    service.refresh().subscribe();
    const request = http.expectOne('/api/auth/refresh');
    expect(request.request.body).toEqual({ token: 'refresh-antigo' });
    request.flush({ token: 'access', refreshToken: 'refresh-novo', id: '1', name: 'Ana', email: 'a@b.com' });
    expect(localStorage.getItem('mad_token')).toBe('access');
    expect(localStorage.getItem('mad_refresh_token')).toBe('refresh-novo');
    expect(localStorage.getItem('mad_user')).toBe('Ana');
    service.clear();
    expect(localStorage.getItem('mad_token')).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('limpa a sessão quando o refresh falha', () => {
    localStorage.setItem('mad_refresh_token', 'inválido');
    service.refresh().subscribe({ error: () => {} });
    http.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(localStorage.getItem('mad_refresh_token')).toBeNull();
  });
});
