import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api.models';

/**
 * الـ API بيرجّع كل الأخطاء بنفس الشكل (ProblemDetails)، فهنا بنحوّلها
 * لـ ApiError واحد، والصفحات تتعامل معاه من غير ما تعرف تفاصيل HTTP.
 */
export const problemDetailsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((error: unknown) => throwError(() => toApiError(error))));

export function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: -1, title: 'Unknown error' };
  }

  if (error.status === 0) {
    return { status: 0, title: 'Network error' };
  }

  const body: unknown = error.error;
  if (body && typeof body === 'object') {
    const problem = body as Partial<ApiError>;
    return {
      status: error.status,
      title: problem.title ?? error.statusText,
      detail: problem.detail,
      errors: problem.errors,
    };
  }

  return { status: error.status, title: error.statusText };
}
