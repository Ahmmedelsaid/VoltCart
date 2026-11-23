import { catchError, map, Observable, of, startWith } from 'rxjs';
import { ApiError } from '../models/api.models';

export type LoadState<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: ApiError };

/** بيحوّل أي request لـ stream من الحالات: loading ثم ready أو error. */
export function toLoadState<T>() {
  return (source: Observable<T>): Observable<LoadState<T>> =>
    source.pipe(
      map((data): LoadState<T> => ({ status: 'ready', data })),
      startWith<LoadState<T>>({ status: 'loading' }),
      catchError((error: ApiError) => of<LoadState<T>>({ status: 'error', error })),
    );
}
