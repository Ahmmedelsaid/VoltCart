import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthResponse } from './auth.models';
import { AuthService } from './auth.service';

const API = `${environment.apiUrl}/auth`;

function sessionResponse(token = 'token-1'): AuthResponse {
  return {
    accessToken: token,
    expiresAtUtc: '2030-01-01T00:00:00Z',
    user: { id: 1, email: 'ana@example.com', fullName: 'Ana Test', role: 'Customer' },
  };
}

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function signIn(): void {
    auth.login({ email: 'ana@example.com', password: 'Passw0rd!1' }).subscribe();
    http.expectOne(`${API}/login`).flush(sessionResponse());
  }

  it('starts anonymous', () => {
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.user()).toBeNull();
    expect(auth.accessToken).toBeNull();
  });

  it('login keeps the user and the token in memory, and sends the cookie', () => {
    let name = '';
    auth
      .login({ email: 'ana@example.com', password: 'Passw0rd!1' })
      .subscribe((u) => (name = u.fullName));

    const request = http.expectOne(`${API}/login`);
    expect(request.request.withCredentials).toBe(true);
    request.flush(sessionResponse());

    expect(name).toBe('Ana Test');
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.accessToken).toBe('token-1');
    expect(localStorage.getItem('voltcart.session')).toBe('1');
    // the token itself must never be written to storage
    expect(JSON.stringify(Object.entries(localStorage))).not.toContain('token-1');
  });

  it('register signs the new customer in', () => {
    auth
      .register({ email: 'ana@example.com', password: 'Passw0rd!1', fullName: 'Ana Test' })
      .subscribe();
    http
      .expectOne(`${API}/register`)
      .flush(sessionResponse(), { status: 201, statusText: 'Created' });

    expect(auth.user()?.email).toBe('ana@example.com');
  });

  it('logout clears the session even when the API call fails', () => {
    signIn();

    auth.logout().subscribe();
    http.expectOne(`${API}/logout`).flush(null, { status: 500, statusText: 'Server Error' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.accessToken).toBeNull();
    expect(localStorage.getItem('voltcart.session')).toBeNull();
  });

  it('refresh sends a single request for concurrent callers', () => {
    const results: string[] = [];
    auth.refresh().subscribe((r) => results.push(r.accessToken));
    auth.refresh().subscribe((r) => results.push(r.accessToken));

    http.expectOne(`${API}/refresh`).flush(sessionResponse('token-2'));

    expect(results).toEqual(['token-2', 'token-2']);
    expect(auth.accessToken).toBe('token-2');
  });

  it('loadSession does not call the server for a first-time visitor', () => {
    auth.loadSession().subscribe();
    http.expectNone(`${API}/refresh`);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('loadSession restores the session when a refresh cookie is still valid', () => {
    localStorage.setItem('voltcart.session', '1');

    auth.loadSession().subscribe();
    http.expectOne(`${API}/refresh`).flush(sessionResponse());

    expect(auth.user()?.fullName).toBe('Ana Test');
  });

  it('loadSession falls back to anonymous when the refresh is rejected', () => {
    localStorage.setItem('voltcart.session', '1');

    auth.loadSession().subscribe();
    http.expectOne(`${API}/refresh`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('voltcart.session')).toBeNull();
  });
});
