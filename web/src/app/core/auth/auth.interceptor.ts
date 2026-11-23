import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** endpoints بتشتغل بالـ cookie، ومالهاش access token. */
const COOKIE_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

/**
 * بيحط الـ access token في طلبات الـ API. ولو طلب اتبعت بـ token وجه 401 (يعني الـ token
 * انتهى)، بيجدّده بالـ cookie ويعيد الطلب مرة واحدة. لو التجديد فشل، الجلسة انتهت
 * فبنودّي المستخدم لصفحة الدخول.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const auth = inject(AuthService);
  const router = inject(Router);
  const path = req.url.slice(environment.apiUrl.length);

  if (COOKIE_ENDPOINTS.some((endpoint) => path.startsWith(endpoint))) {
    return next(req.clone({ withCredentials: true }));
  }

  const withToken = (request: HttpRequest<unknown>) => {
    const token = auth.accessToken;
    return token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
  };

  const hadToken = auth.accessToken !== null;

  return next(withToken(req)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !hadToken) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        catchError(() => {
          auth.clearSession();
          void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => error);
        }),
        switchMap(() => next(withToken(req))),
      );
    }),
  );
};
