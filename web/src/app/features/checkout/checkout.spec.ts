import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { Cart } from '../../core/cart/cart.models';
import { LocationPicker } from '../../shared/ui/location-picker';
import { Checkout } from './checkout';

class EmptyLoader implements TranslocoLoader {
  getTranslation() {
    return of({});
  }
}

const API = environment.apiUrl;

const session: AuthResponse = {
  accessToken: 'token',
  expiresAtUtc: '2030-01-01T00:00:00Z',
  user: { id: 7, email: 'ana@example.com', fullName: 'Ana Test', role: 'Customer' },
};

const cart: Cart = {
  items: [
    {
      productId: 1,
      name: 'Phone',
      imageUrl: null,
      brandName: 'Acme',
      unitPrice: 100,
      quantity: 2,
      stockQuantity: 20,
      lineTotal: 200,
      isAvailable: true,
    },
  ],
  itemCount: 2,
  subtotal: 200,
};

describe('Checkout page', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Checkout],
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
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  /** مستخدم مسجّل دخول وسلته فيها منتج، والصفحة معروضة. */
  async function render() {
    TestBed.inject(AuthService)
      .login({ email: 'ana@example.com', password: 'Passw0rd!1' })
      .subscribe();
    http.expectOne(`${API}/auth/login`).flush(session);
    const fixture = TestBed.createComponent(Checkout);
    await fixture.whenStable();
    http.expectOne(`${API}/cart`).flush(cart);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function fill(element: HTMLElement, id: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    // الـ select بيسمع على change، والباقي على input
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  it('prefills the recipient name from the account', async () => {
    const { element } = await render();
    expect(element.querySelector<HTMLInputElement>('#co-name')!.value).toBe('Ana Test');
  });

  it('shows validation messages and sends nothing when the form is incomplete', async () => {
    const { fixture, element } = await render();
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(element.querySelector('#co-phone-error')).not.toBeNull();
    expect(element.querySelector('#co-address-error')).not.toBeNull();
    expect(element.querySelector('#co-city-error')).not.toBeNull();
    http.expectNone(`${API}/orders`);
  });

  it('rejects an invalid phone number', async () => {
    const { fixture, element } = await render();
    fill(element, 'co-phone', 'abc');
    fill(element, 'co-address', '12 Nile St');
    fill(element, 'co-city', 'Giza');
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(element.querySelector('#co-phone-error')).not.toBeNull();
    http.expectNone(`${API}/orders`);
  });

  it('places the order and opens it, marked as just placed', async () => {
    const { fixture, element } = await render();
    fill(element, 'co-phone', '+20 100 123 4567');
    fill(element, 'co-address', '12 Nile St');
    fill(element, 'co-city', 'Giza');
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));

    const post = http.expectOne(`${API}/orders`);
    expect(post.request.body).toEqual({
      shippingName: 'Ana Test',
      phone: '+20 100 123 4567',
      address: '12 Nile St',
      city: 'Giza',
      notes: null,
      latitude: null,
      longitude: null,
    });
    post.flush({ id: 9 });
    http.expectOne(`${API}/cart`).flush({ items: [], itemCount: 0, subtotal: 0 });
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/orders', 9], { queryParams: { placed: 1 } });
  });

  it('fills the governorate and address from a pin, and sends the pin with the order', async () => {
    const { fixture, element } = await render();
    fill(element, 'co-phone', '+20 100 123 4567');

    const picker = fixture.debugElement.query(By.directive(LocationPicker));
    // الـ picker الحقيقي بيحط الدبوس وبعدين يبلّغ
    picker.componentInstance.position.set({ lat: 30.0131, lng: 31.2089 });
    picker.componentInstance.picked.emit({ lat: 30.0131, lng: 31.2089 });

    const lookup = http.expectOne((r) => r.url === `${API}/geocode/reverse`);
    expect(lookup.request.params.get('lat')).toBe('30.0131');
    expect(lookup.request.params.get('lng')).toBe('31.2089');
    lookup.flush({ address: '12 Nile St, Dokki', state: 'Giza Governorate' });
    await fixture.whenStable();

    expect(element.querySelector<HTMLSelectElement>('#co-city')!.value).toBe('Giza');
    expect(element.querySelector<HTMLTextAreaElement>('#co-address')!.value).toBe(
      '12 Nile St, Dokki',
    );

    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    const post = http.expectOne(`${API}/orders`);
    expect(post.request.body).toMatchObject({
      city: 'Giza',
      address: '12 Nile St, Dokki',
    });
    expect(post.request.body.latitude).toBeCloseTo(30.0131);
    expect(post.request.body.longitude).toBeCloseTo(31.2089);
    post.flush({ id: 9 });
    http.expectOne(`${API}/cart`).flush({ items: [], itemCount: 0, subtotal: 0 });
  });

  it('keeps an address the customer typed when a pin is dropped', async () => {
    const { fixture, element } = await render();
    fill(element, 'co-address', 'My own address 5');

    const picker = fixture.debugElement.query(By.directive(LocationPicker));
    picker.componentInstance.picked.emit({ lat: 30.0444, lng: 31.2357 });
    http
      .expectOne((r) => r.url === `${API}/geocode/reverse`)
      .flush({ address: 'Somewhere else', state: 'Cairo Governorate' });
    await fixture.whenStable();

    expect(element.querySelector<HTMLTextAreaElement>('#co-address')!.value).toBe(
      'My own address 5',
    );
    expect(element.querySelector<HTMLSelectElement>('#co-city')!.value).toBe('Cairo');
  });

  it('shows the stock message and reloads the cart when the API refuses with 409', async () => {
    const { fixture, element } = await render();
    fill(element, 'co-phone', '+20 100 123 4567');
    fill(element, 'co-address', '12 Nile St');
    fill(element, 'co-city', 'Giza');
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));

    http
      .expectOne(`${API}/orders`)
      .flush({ title: 'Conflict', status: 409 }, { status: 409, statusText: 'Conflict' });
    http.expectOne(`${API}/cart`).flush(cart);
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
