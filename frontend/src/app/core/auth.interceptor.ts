import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const token = localStorage.getItem('mad_token');
  const authenticated = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
  return next(authenticated).pipe(catchError((error: HttpErrorResponse) => {
    const publicAuthCall = ['/login', '/register', '/confirm-email', '/forgot-password',
      '/reset-password', '/google', '/refresh', '/config'].some(path => request.url.endsWith(`/api/auth${path}`));
    if (error.status !== 401 || publicAuthCall || !localStorage.getItem('mad_refresh_token')) {
      if (error.status === 401 && !publicAuthCall) session.clear();
      return throwError(() => error);
    }
    return session.refresh().pipe(
      switchMap((response) => next(request.clone({
        setHeaders: { Authorization: `Bearer ${response.token}` }
      }))),
      catchError((refreshError) => {
        session.clear();
        return throwError(() => refreshError);
      })
    );
  }));
};
