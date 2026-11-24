import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { CartService } from '../cart/cart.service';
import { Order, PlaceOrderRequest } from './order.models';
import { OrdersService, orderErrorKey } from './orders.service';

const API = `${environment.apiUrl}`;

const request: PlaceOrderRequest = {
  shippingName: 'Ana Test',
  phone: '+20 100 123 4567',
  address: '12 Nile St',
  city: 'Giza',
  notes: null,
  latitude: null,
  longitude: null,
};

const order: Order = {
  id: 5,
  status: 'Placed',
  total: 100,
  itemCount: 1,
  createdAt: '2026-11-23T10:00:00',
  cancelledAt: null,
  ...request,
  items: [
    { productId: 1, name: 'Phone', imageUrl: null, unitPrice: 100, quantity: 1, lineTotal: 100 },
  ],
};

const session: AuthResponse = {
  accessToken: 'token',
  expiresAtUtc: '2030-01-01T00:00:00Z',
  user: { id: 7, email: 'ana@example.com', fullName: 'Ana Test', role: 'Customer' },
};

describe('OrdersService', () => {
  let orders: OrdersService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    orders = TestBed.inject(OrdersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists, reads and cancels orders through the API', () => {
    orders.list().subscribe();
    expect(http.expectOne(`${API}/orders`).request.method).toBe('GET');

    orders.get(5).subscribe();
    http.expectOne(`${API}/orders/5`).flush(order);

    orders.cancel(5).subscribe((result) => expect(result.status).toBe('Cancelled'));
    const cancel = http.expectOne(`${API}/orders/5/cancel`);
    expect(cancel.request.method).toBe('POST');
    cancel.flush({ ...order, status: 'Cancelled' });
  });

  it('places an order and then refreshes the cart, which the API emptied', () => {
    // نسجّل دخول عشان CartService يحمّل السلة وreload يشتغل
    const auth = TestBed.inject(AuthService);
    TestBed.inject(CartService);
    auth.login({ email: 'ana@example.com', password: 'Passw0rd!1' }).subscribe();
    http.expectOne(`${API}/auth/login`).flush(session);
    TestBed.tick();
    http.expectOne(`${API}/cart`).flush({ items: [], itemCount: 2, subtotal: 200 });

    let placed: Order | undefined;
    orders.place(request).subscribe((result) => (placed = result));
    const post = http.expectOne(`${API}/orders`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(request);
    post.flush(order);

    expect(placed?.id).toBe(5);
    // بعد الطلب بنجيب السلة تاني (فاضية)
    http.expectOne(`${API}/cart`).flush({ items: [], itemCount: 0, subtotal: 0 });
    expect(TestBed.inject(CartService).count()).toBe(0);
  });

  it('maps API errors to translation keys', () => {
    expect(orderErrorKey({ status: 0, title: '' })).toBe('errors.network');
    expect(orderErrorKey({ status: 400, title: '' })).toBe('checkout.errors.invalid');
    expect(orderErrorKey({ status: 404, title: '' })).toBe('orders.errors.notFound');
    expect(orderErrorKey({ status: 409, title: '' })).toBe('checkout.errors.stock');
    expect(orderErrorKey({ status: 500, title: '' })).toBe('errors.server');
  });
});
