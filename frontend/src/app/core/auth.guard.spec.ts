import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  it('autoriza com token e redireciona sem token', () => {
    expect(TestBed.runInInjectionContext(() => authGuard(null as never, null as never))).toBeInstanceOf(UrlTree);
    localStorage.setItem('mad_token', 'token');
    expect(TestBed.runInInjectionContext(() => authGuard(null as never, null as never))).toBe(true);
    expect(TestBed.inject(Router)).toBeTruthy();
  });
});
