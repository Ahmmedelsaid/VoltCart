import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../toast/toast.service';
import { Cart } from './cart.models';
import { CartService, cartErrorKey } from './cart.service';

const CART_URL = `${environment.apiUrl}/cart`;

function cartOf(quantity: number): Cart {
  return {
    items: [
      {
        productId: 1,
        name: 'Phone',
        imageUrl: null,
        brandName: 'Acme',
        unitPrice: 100,
        quantity,
        stockQuantity: 20,
        lineTotal: 100 * quantity,
        isAvailable: true,
      },
    ],
    itemCount: quantity,
    subtotal: 100 * quantity,
  };
}

const session: AuthResponse = {
  accessToken: 'token',
  expiresAtUtc: '2030-01-01T00:00:00Z',
  user: { id: 7, email: 'ana@example.com', fullName: 'Ana Test', role: 'Customer' },
};

describe('CartService', () => {
  let cart: CartService;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    cart = TestBed.inject(CartService);
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** تسجيل دخول + تحميل السلة الأولية. */
  function signIn(initial: Cart = cartOf(1)): void {
    auth.login({ email: 'ana@example.com', password: 'Passw0rd!1' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(session);
    TestBed.tick();
    http.expectOne(CART_URL).flush(initial);
  }

  it('has an empty count while signed out and does not call the API', () => {
    TestBed.tick();
    expect(cart.count()).toBe(0);
    expect(cart.cart()).toBeNull();
  });

  it('loads the cart when the user signs in', () => {
    signIn(cartOf(3));
    expect(cart.count()).toBe(3);
  });

  it('clears the cart when the user signs out', () => {
    signIn();
    auth.logout().subscribe();
    http.expectOne(`${environment.apiUrl}/auth/logout`).flush(null);
    TestBed.tick();
    expect(cart.cart()).toBeNull();
    expect(cart.count()).toBe(0);
  });

  it('updates the state from the cart returned by add', () => {
    signIn();
    cart.add(1, 2).subscribe();
    const req = http.expectOne(`${CART_URL}/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productId: 1, quantity: 2 });
    req.flush(cartOf(3));
    expect(cart.count()).toBe(3);
  });

  it('updates the state after changing a quantity and removing an item', () => {
    signIn(cartOf(3));
    cart.setQuantity(1, 5).subscribe();
    const put = http.expectOne(`${CART_URL}/items/1`);
    expect(put.request.method).toBe('PUT');
    put.flush(cartOf(5));
    expect(cart.count()).toBe(5);

    cart.remove(1).subscribe();
    const del = http.expectOne(`${CART_URL}/items/1`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ items: [], itemCount: 0, subtotal: 0 });
    expect(cart.count()).toBe(0);
  });

  it('sends a signed-out visitor to login instead of calling the API', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    cart.addFromCatalog(1);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  });

  it('shows a success toast and then clears the busy flag', () => {
    signIn();
    const toasts = TestBed.inject(ToastService);
    cart.addFromCatalog(1);
    expect(cart.addingProductId()).toBe(1);
    http.expectOne(`${CART_URL}/items`).flush(cartOf(2));
    expect(cart.addingProductId()).toBeNull();
    expect(toasts.toasts()[0]?.key).toBe('cart.added');
  });

  it('shows the stock message when the API refuses', () => {
    signIn();
    const toasts = TestBed.inject(ToastService);
    cart.addFromCatalog(1);
    http
      .expectOne(`${CART_URL}/items`)
      .flush({ title: 'Conflict', status: 409 }, { status: 409, statusText: 'Conflict' });
    expect(toasts.toasts()[0]).toMatchObject({ kind: 'error', key: 'cart.errors.stock' });
    expect(cart.addingProductId()).toBeNull();
  });

  it('maps API errors to translation keys', () => {
    expect(cartErrorKey({ status: 0, title: '' })).toBe('errors.network');
    expect(cartErrorKey({ status: 409, title: '' })).toBe('cart.errors.stock');
    expect(cartErrorKey({ status: 404, title: '' })).toBe('cart.errors.gone');
    expect(cartErrorKey({ status: 500, title: '' })).toBe('errors.server');
  });
});
