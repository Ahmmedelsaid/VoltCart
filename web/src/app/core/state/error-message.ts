import { ApiError } from '../models/api.models';

/** مفتاح الترجمة المناسب لنوع الخطأ. */
export function errorMessageKey(error: ApiError): string {
  if (error.status === 0) return 'errors.network';
  if (error.status === 404) return 'errors.notFoundProduct';
  return 'errors.server';
}
