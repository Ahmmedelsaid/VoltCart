import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ApiError } from '../models/api.models';
import { ToastService } from '../toast/toast.service';
import { Cart } from './cart.models';

/** مفتاح الترجمة المناسب لخطأ من الـ API في عمليات السلة. */
export function cartErrorKey(error: ApiError): string {
  if (error.status === 0) return 'errors.network';
  if (error.status === 409) return 'cart.errors.stock';
  if (error.status === 404) return 'cart.errors.gone';
  return 'errors.server';
}

/**
 * سلة العميل المسجّل. الحالة الحقيقية في الـ API (بتفضل لو فتح من جهاز تاني)،
 * وهنا نسخة منها في signal عشان الـ header والصفحات تتحدّث لوحدها.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly baseUrl = `${environment.apiUrl}/cart`;

  private readonly state = signal<Cart | null>(null);
  readonly cart = this.state.asReadonly();
  readonly count = computed(() => this.state()?.itemCount ?? 0);

  /** المنتج اللي بنضيفه دلوقتي (عشان الزرار يتعطّل ومفيش ضغطتين). */
  readonly addingProductId = signal<number | null>(null);

  constructor() {
    // السلة بتتحمّل لما المستخدم يدخل، وبتتفضّى لما يخرج أو يتبدّل. switchMap بيلغي رد قديم.
    toObservable(computed(() => this.auth.user()?.id ?? null))
      .pipe(
        switchMap((userId) =>
          userId === null
            ? of(null)
            : this.http.get<Cart>(this.baseUrl).pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((cart) => this.state.set(cart));
  }

  add(productId: number, quantity = 1): Observable<Cart> {
    return this.http
      .post<Cart>(`${this.baseUrl}/items`, { productId, quantity })
      .pipe(tap((cart) => this.state.set(cart)));
  }

  setQuantity(productId: number, quantity: number): Observable<Cart> {
    return this.http
      .put<Cart>(`${this.baseUrl}/items/${productId}`, { quantity })
      .pipe(tap((cart) => this.state.set(cart)));
  }

  remove(productId: number): Observable<Cart> {
    return this.http
      .delete<Cart>(`${this.baseUrl}/items/${productId}`)
      .pipe(tap((cart) => this.state.set(cart)));
  }

  /**
   * زرار "أضف للسلة" في أي مكان: لو الزائر مش مسجّل بنودّيه لصفحة الدخول ويرجع لنفس الصفحة،
   * ولو مسجّل بنضيف ونعرض رسالة نجاح أو سبب الفشل (مخزون مش كفاية...).
   */
  addFromCatalog(productId: number, quantity = 1): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (this.addingProductId() !== null) return;

    this.addingProductId.set(productId);
    this.add(productId, quantity)
      .pipe(
        tap(() =>
          this.toasts.show({
            kind: 'success',
            key: 'cart.added',
            action: { key: 'cart.view', link: '/cart' },
          }),
        ),
        catchError((error: ApiError) => {
          this.toasts.show({ kind: 'error', key: cartErrorKey(error) });
          return EMPTY;
        }),
        finalize(() => this.addingProductId.set(null)),
      )
      .subscribe();
  }
}
