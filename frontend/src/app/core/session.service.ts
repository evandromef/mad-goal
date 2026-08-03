import { inject, Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse } from './api.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly rawHttp = new HttpClient(inject(HttpBackend));
  private readonly router = inject(Router);
  private refreshing?: Observable<AuthResponse>;

  save(session: AuthResponse): void {
    localStorage.setItem('mad_token', session.token);
    localStorage.setItem('mad_refresh_token', session.refreshToken);
    localStorage.setItem('mad_user', session.name);
  }

  refresh(): Observable<AuthResponse> {
    if (!this.refreshing) {
      this.refreshing = this.rawHttp.post<AuthResponse>('/api/auth/refresh', {
        token: localStorage.getItem('mad_refresh_token')
      }).pipe(
        tap({
          next: (session) => this.save(session),
          error: () => this.clear()
        }),
        shareReplay(1)
      );
      this.refreshing.subscribe({ next: () => this.refreshing = undefined, error: () => this.refreshing = undefined });
    }
    return this.refreshing;
  }

  clear(): void {
    localStorage.removeItem('mad_token');
    localStorage.removeItem('mad_refresh_token');
    localStorage.removeItem('mad_user');
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
