import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('mapeia os contratos REST do MVP', () => {
    const calls: [unknown, string, string][] = [
      [api.login({ email: 'a@b.com', password: '12345678' }), 'POST', '/api/auth/login'],
      [api.register({ name: 'A', email: 'a@b.com', password: '12345678' }), 'POST', '/api/auth/register'],
      [api.confirmEmail('token'), 'POST', '/api/auth/confirm-email'],
      [api.forgotPassword('a@b.com'), 'POST', '/api/auth/forgot-password'],
      [api.resetPassword('token', '12345678'), 'POST', '/api/auth/reset-password'],
      [api.googleLogin('credential'), 'POST', '/api/auth/google'],
      [api.authConfig(), 'GET', '/api/auth/config'],
      [api.wallets(), 'GET', '/api/wallets'],
      [api.createWallet('Carteira'), 'POST', '/api/wallets'],
      [api.updateWallet('w', 'Carteira'), 'PUT', '/api/wallets/w'],
      [api.deleteWallet('w'), 'DELETE', '/api/wallets/w?confirm=true'],
      [api.assets(), 'GET', '/api/assets'],
      [api.dashboard('w', 'YEARLY'), 'GET', '/api/dashboard/w?granularity=YEARLY'],
      [api.records('w'), 'GET', '/api/records?walletId=w'],
      [api.createRecord({}), 'POST', '/api/records'],
      [api.updateRecord('r', {}), 'PUT', '/api/records/r'],
      [api.deleteRecord('r'), 'DELETE', '/api/records/r'],
      [api.notes('w', 'a'), 'GET', '/api/notes?walletId=w&assetId=a'],
      [api.createNote({ walletId: 'w', assetId: 'a', content: 'n' }), 'POST', '/api/notes'],
      [api.updateNote('n', { walletId: 'w', assetId: 'a', content: 'n' }), 'PUT', '/api/notes/n'],
      [api.deleteNote('n'), 'DELETE', '/api/notes/n'],
      [api.incomes('w', { groupBy: 'MONTHLY' }), 'GET', '/api/incomes?walletId=w&groupBy=MONTHLY'],
      [api.profile(), 'GET', '/api/auth/me'],
      [api.updateProfile({ name: 'A', email: 'a@b.com' }), 'PUT', '/api/profile'],
      [api.deleteProfile(), 'DELETE', '/api/profile?confirm=true']
    ];
    for (const [observable, method, url] of calls) {
      (observable as { subscribe: (callback: () => void) => void }).subscribe(() => {});
      const request = http.expectOne(url);
      expect(request.request.method).toBe(method);
      request.flush(method === 'DELETE' ? null : {});
    }
  });
});
