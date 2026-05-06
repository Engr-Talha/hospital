import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '@hospital/shared';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = route.data['roles'] as Role[] | undefined;
  if (!allowed?.length) return true;
  const user = auth.user();
  if (!user || !allowed.includes(user.role)) {
    void router.navigateByUrl(auth.homePath());
    return false;
  }
  return true;
};
