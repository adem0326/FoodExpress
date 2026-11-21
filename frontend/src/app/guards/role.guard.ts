import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as UserRole[] | undefined;

  if (!auth.getToken()) {
    return router.createUrlTree(['/login']);
  }

  return auth.getProfile().pipe(
    map(({ user }) => allowedRoles?.includes(user.role)
      ? true
      : router.parseUrl(auth.getHomeRoute(user.role))),
    catchError((error: { status?: number }) => {
      if (error.status === 401 || error.status === 403) {
        auth.logout();
      }
      return of(router.createUrlTree(['/login']));
    })
  );
};
