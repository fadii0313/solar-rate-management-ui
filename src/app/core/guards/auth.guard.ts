import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const requiredPermission = route.data?.['permission'] as string;
    if (requiredPermission && !authService.hasPermission(requiredPermission)) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
