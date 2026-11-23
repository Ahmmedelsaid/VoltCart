import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse } from './auth.models';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const API = environment.apiUrl;

function sessionResponse(token: string): AuthResponse {
  return {
    accessToken: token,
    expiresAtUtc: '2030-01-01T00:00:00Z',
    user: { id: 1, email: 'ana@example.com', fullName: 'Ana Test', role: 'Customer' },
  };
}

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  function signIn(token = 'token-1'): void {
    auth.login({ email: 'ana@example.com', password: 'Passw0rd!1' }).subscribe();
    http.expectOne(`${API}/auth/login`).flush(sessionResponse(token));
  }

  it('adds the bearer token to API requests', () => {
    signIn();

    client.get(`${API}/products`).subscribe();

    const request = http.expectOne(`${API}/products`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-1');
    request.flush([]);
  });

  it('does not add anything to requests for other sites', () => {
    signIn();

    client.get('https://cdn.example.com/file.json').subscribe();

    const request = http.expectOne('https://cdn.example.com/file.json');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.withCredentials).toBe(false);
    request.flush({});
  });

  it('sends the cookie endpoints with credentials and without a bearer token', () => {
    signIn();

    client.post(`${API}/auth/logout`, null).subscribe();

    const request = http.expectOne(`${API}/auth/logout`);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(null);
  });

  it('refreshes the token once and retries the request after a 401', () => {
    signIn('token-1');
    let body: unknown;

    client.get(`${API}/auth/me`).subscribe((value) => (body = value));
    http.expectOne(`${API}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });

    http.expectOne(`${API}/auth/refresh`).flush(sessionResponse('token-2'));

    const retry = http.expectOne(`${API}/auth/me`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer token-2');
    retry.flush({ ok: true });

    expect(body).toEqual({ ok: true });
  });

  it('signs out and goes to /login when the refresh is rejected', () => {
    signIn();
    let status = 0;

    client.get(`${API}/auth/me`).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${API}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(`${API}/auth/refresh`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(auth.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], expect.anything());
  });

  it('does not try to refresh when the request was anonymous', () => {
    let status = 0;

    client.get(`${API}/auth/me`).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${API}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });

    http.expectNone(`${API}/auth/refresh`);
    expect(status).toBe(401);
  });

  it('retries only once: a second 401 is returned to the caller', () => {
    signIn();
    let status = 0;

    client.get(`${API}/auth/me`).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${API}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(`${API}/auth/refresh`).flush(sessionResponse('token-2'));
    http.expectOne(`${API}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });

    http.expectNone(`${API}/auth/refresh`);
    expect(status).toBe(401);
  });

  it('does not refresh for errors other than 401', () => {
    signIn();
    let status = 0;

    client.get(`${API}/products`).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${API}/products`).flush(null, { status: 500, statusText: 'Server Error' });

    http.expectNone(`${API}/auth/refresh`);
    expect(status).toBe(500);
    expect(auth.isAuthenticated()).toBe(true);
  });
});
