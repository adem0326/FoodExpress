import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getToken()) {
    return router.createUrlTree(['/login']);
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getToken()) {
    return true;
  }

  return auth.getProfile().pipe(
    map(({ user }) => router.parseUrl(auth.getHomeRoute(user.role))),
    catchError((error: { status?: number }) => {
      if (error.status === 401 || error.status === 403) {
        auth.logout();
        return of(true);
      }
      return of(true);
    })
  );
};
