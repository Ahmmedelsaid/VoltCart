import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order } from '../../core/orders/order.models';
import { SHOP_WHATSAPP } from '../../core/site';
import { OrderDetail } from './order-detail';

class Loader implements TranslocoLoader {
  getTranslation() {
    return of({
      orders: {
        whatsapp: {
          button: 'Send my order on WhatsApp',
          message: 'Order #{{id}} total EGP {{total}} for {{name}} ({{phone}})',
        },
      },
    });
  }
}

const order: Order = {
  id: 12,
  status: 'Placed',
  total: 77000,
  itemCount: 2,
  createdAt: '2026-11-24T10:00:00',
  cancelledAt: null,
  shippingName: 'Ana Test',
  phone: '01011252834',
  address: '12 Nile St',
  city: 'Giza',
  notes: null,
  latitude: null,
  longitude: null,
  items: [],
};

describe('Order detail WhatsApp button', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetail],
      providers: [
        provideRouter([]),
        // رقم واتساب المتجر لازم يكون متظبط عشان الزرار يظهر
        { provide: SHOP_WHATSAPP, useValue: '201012345678' },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
            missingHandler: { logMissingKey: false },
          },
          loader: Loader,
        }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function render(status: Order['status']) {
    const fixture = TestBed.createComponent(OrderDetail);
    fixture.componentRef.setInput('id', '12');
    await fixture.whenStable();
    http.expectOne(`${environment.apiUrl}/orders/12`).flush({ ...order, status });
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('opens a wa.me chat with the shop and a ready message about the order', async () => {
    const element = await render('Placed');

    const link = element.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]')!;
    expect(link).not.toBeNull();

    const url = new URL(link.href);
    expect(url.pathname).toBe('/201012345678');
    expect(url.searchParams.get('text')).toBe(
      'Order #12 total EGP 77,000 for Ana Test (01011252834)',
    );
  });

  it('does not offer it for a cancelled order', async () => {
    const element = await render('Cancelled');

    expect(element.querySelector('a[href^="https://wa.me/"]')).toBeNull();
  });
});
