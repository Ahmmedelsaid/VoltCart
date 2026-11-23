import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** صفحات العميل (زي حسابي): لو مش مسجّل دخول بنودّيه لصفحة الدخول وبعدها يرجع لنفس الصفحة. */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(AuthService).isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** صفحات الدخول والتسجيل: لو مسجّل دخول أصلًا مفيش داعي يشوفها. */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService).isAuthenticated() ? router.createUrlTree(['/account']) : true;
};

/** بيمنع redirect لموقع تاني (open redirect): بنقبل مسارات داخل الموقع بس. */
export function safeReturnUrl(url: string | null): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/account';
}
