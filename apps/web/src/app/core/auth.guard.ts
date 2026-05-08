import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TrialService } from './trial.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const trial = inject(TrialService);
  const router = inject(Router);
  if (trial.trialEnabled() && trial.expired()) {
    void router.navigate(['/login'], { queryParams: { trialEnded: '1' } });
    return false;
  }
  if (!auth.token()) {
    void router.navigateByUrl('/login');
    return false;
  }
  return true;
};
