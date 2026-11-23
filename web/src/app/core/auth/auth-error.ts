import { ApiError } from '../models/api.models';

/** مفتاح الترجمة المناسب لخطأ من الـ auth endpoints. */
export function authErrorKey(error: ApiError): string {
  switch (error.status) {
    case 0:
      return 'errors.network';
    case 400:
      return 'auth.errors.invalidInput';
    case 401:
      return 'auth.errors.invalidCredentials';
    case 409:
      return 'auth.errors.emailTaken';
    case 429:
      return 'auth.errors.tooManyAttempts';
    default:
      return 'errors.server';
  }
}
