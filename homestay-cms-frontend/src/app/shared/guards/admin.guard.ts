import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protects /admin/* routes (other than the login page itself). */
export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitUntilInitialized();

  return authService.isAdmin() ? true : router.createUrlTree(['/admin/login']);
};
