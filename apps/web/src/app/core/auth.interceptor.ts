import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'hospital_token';
const USER_KEY = 'hospital_user';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  const router = inject(Router);
  return next(authReq).pipe(
    catchError((err: { status?: number }) => {
      if (
        err?.status === 401 &&
        !req.url.includes('/api/auth/login')
      ) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        void router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
