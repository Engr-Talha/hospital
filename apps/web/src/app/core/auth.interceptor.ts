import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TrialService } from './trial.service';

const TOKEN_KEY = 'hospital_token';
const USER_KEY = 'hospital_user';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  const router = inject(Router);
  const trial = inject(TrialService);
  return next(authReq).pipe(
    catchError((err: unknown) => {
      const e = err instanceof HttpErrorResponse ? err : null;
      const msg =
        e?.error &&
        typeof e.error === 'object' &&
        'message' in e.error &&
        typeof (e.error as { message: unknown }).message === 'string'
          ? (e.error as { message: string }).message
          : '';
      if (e?.status === 403 && msg === 'TRIAL_EXPIRED') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        trial.markExpiredFromApi();
        void router.navigate(['/login'], { queryParams: { trialEnded: '1' } });
      } else if (
        e?.status === 401 &&
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
