import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Login } from './login';

class EmptyLoader implements TranslocoLoader {
  getTranslation() {
    return of({});
  }
}

describe('Login page', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
            missingHandler: { logMissingKey: false },
          },
          loader: EmptyLoader,
        }),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  async function render() {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function fill(element: HTMLElement, email: string, password: string): void {
    const type = (selector: string, value: string) => {
      const input = element.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    type('#login-email', email);
    type('#login-password', password);
  }

  it('shows validation messages and sends nothing when the form is empty', async () => {
    const { fixture, element } = await render();

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(element.querySelector('#login-email-error')).toBeTruthy();
    expect(element.querySelector('#login-password-error')).toBeTruthy();
    http.expectNone(`${environment.apiUrl}/auth/login`);
  });

  it('signs in and goes to the account page', async () => {
    const { fixture, element } = await render();
    fill(element, 'ana@example.com', 'Passw0rd!1');

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.body).toEqual({ email: 'ana@example.com', password: 'Passw0rd!1' });
    request.flush({
      accessToken: 'token-1',
      expiresAtUtc: '2030-01-01T00:00:00Z',
      user: { id: 1, email: 'ana@example.com', fullName: 'Ana', role: 'Customer' },
    });
    await fixture.whenStable();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/account');
  });

  it('shows an error and stays on the page when the credentials are wrong', async () => {
    const { fixture, element } = await render();
    fill(element, 'ana@example.com', 'WrongPass1');

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ status: 401, title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')).toBeTruthy();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
