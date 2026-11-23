import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from './auth.models';

/** علامة بسيطة (مش سرّ) بتقول إن فيه جلسة، عشان ما نسأل السيرفر لو الزائر ما سجّلش دخول قبل كده. */
const SESSION_HINT_KEY = 'voltcart.session';

/**
 * حالة تسجيل الدخول.
 *  - الـ access token بيتخزّن في الذاكرة بس (مش localStorage)، فسرقته بـ XSS أصعب.
 *  - الـ refresh token في cookie HttpOnly: الـ JavaScript ما بيشوفهوش خالص.
 *    المتصفح بيبعته لوحده لمسارات /auth لما نطلب refresh.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly credentials = { withCredentials: true };

  private readonly userState = signal<AuthUser | null>(null);
  private accessTokenValue: string | null = null;
  private refreshInFlight$: Observable<AuthResponse> | null = null;

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  /** بيقراه الـ interceptor بشكل متزامن عشان يحطه في الـ header. */
  get accessToken(): string | null {
    return this.accessTokenValue;
  }

  login(request: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request, this.credentials).pipe(
      tap((response) => this.setSession(response)),
      map((response) => response.user),
    );
  }

  register(request: RegisterRequest): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request, this.credentials).pipe(
      tap((response) => this.setSession(response)),
      map((response) => response.user),
    );
  }

  /** بنمسح الجلسة محليًا حتى لو السيرفر ما ردّش. */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, null, this.credentials).pipe(
      catchError(() => of(undefined)),
      tap(() => this.clearSession()),
      map(() => undefined),
    );
  }

  /**
   * بيجيب access token جديد بالـ cookie. لو كذا طلب انتهت صلاحيتهم مع بعض، بيتبعت
   * request واحد بس والباقي بيستنى نتيجته (وإلا الـ token بيتلف مرتين).
   */
  refresh(): Observable<AuthResponse> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post<AuthResponse>(`${this.baseUrl}/refresh`, null, this.credentials)
        .pipe(
          tap((response) => this.setSession(response)),
          finalize(() => (this.refreshInFlight$ = null)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.refreshInFlight$;
  }

  /** بيتنادى مرة عند بداية التطبيق: يرجّع الجلسة لو الـ cookie لسه صالحة. */
  loadSession(): Observable<void> {
    if (!this.hasSessionHint()) return of(undefined);

    return this.refresh().pipe(
      map(() => undefined),
      catchError(() => {
        this.clearSession();
        return of(undefined);
      }),
    );
  }

  clearSession(): void {
    this.userState.set(null);
    this.accessTokenValue = null;
    this.storeSessionHint(false);
  }

  private setSession(response: AuthResponse): void {
    this.accessTokenValue = response.accessToken;
    this.userState.set(response.user);
    this.storeSessionHint(true);
  }

  private hasSessionHint(): boolean {
    try {
      return localStorage.getItem(SESSION_HINT_KEY) === '1';
    } catch {
      return false;
    }
  }

  private storeSessionHint(active: boolean): void {
    try {
      if (active) localStorage.setItem(SESSION_HINT_KEY, '1');
      else localStorage.removeItem(SESSION_HINT_KEY);
    } catch {
      // الـ storage ممكن يكون مقفول. الجلسة لسه شغّالة، بس مش هتترجّع بعد refresh للصفحة.
    }
  }
}
