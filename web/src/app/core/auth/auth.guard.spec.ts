import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { authGuard, guestGuard, safeReturnUrl } from './auth.guard';
import { AuthService } from './auth.service';

describe('route guards', () => {
  const authenticated = signal(false);

  beforeEach(() => {
    authenticated.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: () => authenticated() } },
      ],
    });
  });

  const route = {} as ActivatedRouteSnapshot;
  const state = (url: string) => ({ url }) as RouterStateSnapshot;

  it('authGuard sends visitors to /login and remembers where they were going', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(route, state('/account')));

    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/login?returnUrl=%2Faccount',
    );
  });

  it('authGuard lets signed-in customers through', () => {
    authenticated.set(true);
    expect(TestBed.runInInjectionContext(() => authGuard(route, state('/account')))).toBe(true);
  });

  it('guestGuard keeps signed-in customers away from the login page', () => {
    authenticated.set(true);

    const result = TestBed.runInInjectionContext(() => guestGuard(route, state('/login')));

    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/account',
    );
  });

  it('guestGuard lets visitors see the login page', () => {
    expect(TestBed.runInInjectionContext(() => guestGuard(route, state('/login')))).toBe(true);
  });
});

describe('safeReturnUrl', () => {
  it('accepts paths inside the site', () => {
    expect(safeReturnUrl('/products/3?x=1')).toBe('/products/3?x=1');
  });

  it('falls back to /account for anything that could leave the site', () => {
    expect(safeReturnUrl(null)).toBe('/account');
    expect(safeReturnUrl('')).toBe('/account');
    expect(safeReturnUrl('https://evil.example')).toBe('/account');
    expect(safeReturnUrl('//evil.example')).toBe('/account');
    expect(safeReturnUrl('javascript:alert(1)')).toBe('/account');
  });
});
