import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SHOP_WHATSAPP, SITE_INFO, SiteInfo } from '../../core/site';
import { Contact } from './contact';

class Loader implements TranslocoLoader {
  getTranslation() {
    return of({ contact: { whatsapp: { message: 'Hello VoltCart, I have a question.' } } });
  }
}

const CONTACT_URL = `${environment.apiUrl}/contact`;

const emptySite: SiteInfo = {
  name: 'VoltCart',
  email: '',
  phone: '',
  whatsapp: '',
  address: { ar: '', en: '' },
  hours: { ar: '', en: '' },
};

describe('Contact page', () => {
  let http: HttpTestingController;

  async function setup(extra: Provider[] = []) {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Contact],
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
          loader: Loader,
        }),
        ...extra,
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  async function render() {
    const fixture = TestBed.createComponent(Contact);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function fill(element: HTMLElement, id: string, value: string): void {
    const field = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  function chooseTopic(element: HTMLElement, topic: string): void {
    // الـ radios بنفس ترتيب المواضيع في الصفحة
    const index = ['product', 'order', 'complaint', 'other'].indexOf(topic);
    const radio = element.querySelectorAll<HTMLInputElement>('input[type="radio"]')[index];
    radio.checked = true;
    radio.dispatchEvent(new Event('change'));
  }

  function fillValid(element: HTMLElement): void {
    fill(element, 'ct-name', 'Ana Test');
    fill(element, 'ct-email', 'ana@example.com');
    fill(element, 'ct-message', 'Where is my order? It was due yesterday.');
  }

  function submit(element: HTMLElement): void {
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
  }

  describe('the form', () => {
    beforeEach(() => setup());

    it('shows validation messages, sends nothing and focuses the first wrong field', async () => {
      const { fixture, element } = await render();
      submit(element);
      await fixture.whenStable();

      expect(element.querySelector('#ct-name-error')).not.toBeNull();
      expect(element.querySelector('#ct-email-error')).not.toBeNull();
      expect(element.querySelector('#ct-message-error')).not.toBeNull();
      expect(document.activeElement?.id).toBe('ct-name');
      http.expectNone(CONTACT_URL);
    });

    it('rejects an invalid email and a too short message', async () => {
      const { fixture, element } = await render();
      fillValid(element);
      fill(element, 'ct-email', 'not-an-email');
      fill(element, 'ct-message', 'short');
      submit(element);
      await fixture.whenStable();

      expect(element.querySelector('#ct-email-error')).not.toBeNull();
      expect(element.querySelector('#ct-message-error')).not.toBeNull();
      expect(document.activeElement?.id).toBe('ct-email');
      http.expectNone(CONTACT_URL);
    });

    it('sends the topic, takes the subject from the message and thanks the visitor', async () => {
      const { fixture, element } = await render();
      fillValid(element);
      submit(element);

      const post = http.expectOne(CONTACT_URL);
      expect(post.request.body).toEqual({
        name: 'Ana Test',
        email: 'ana@example.com',
        phone: null,
        subject: 'Where is my order? It was due yesterday.',
        message: 'Where is my order? It was due yesterday.',
        topic: 'product',
        orderNumber: null,
        website: '',
      });
      post.flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      expect(element.querySelector('form')).toBeNull();
      expect(element.querySelector('[role="status"]')).not.toBeNull();
    });

    it('asks for an order number only for order topics and sends it as a number', async () => {
      const { fixture, element } = await render();
      expect(element.querySelector('#ct-order')).toBeNull();

      chooseTopic(element, 'order');
      await fixture.whenStable();
      expect(element.querySelector('#ct-order')).not.toBeNull();

      fillValid(element);
      fill(element, 'ct-order', '1042');
      submit(element);

      const post = http.expectOne(CONTACT_URL);
      expect(post.request.body.topic).toBe('order');
      expect(post.request.body.orderNumber).toBe(1042);
      post.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('rejects an order number that is not digits', async () => {
      const { fixture, element } = await render();
      chooseTopic(element, 'order');
      await fixture.whenStable();
      fillValid(element);
      fill(element, 'ct-order', 'abc');
      submit(element);
      await fixture.whenStable();

      expect(element.querySelector('#ct-order-error')).not.toBeNull();
      http.expectNone(CONTACT_URL);
    });

    it('tells the visitor when they sent too many messages (429)', async () => {
      const { fixture, element } = await render();
      fillValid(element);
      submit(element);

      http.expectOne(CONTACT_URL).flush(null, { status: 429, statusText: 'Too Many Requests' });
      await fixture.whenStable();

      expect(element.querySelector('[role="alert"]')).not.toBeNull();
      expect(element.querySelector('form')).not.toBeNull();
    });

    it('hides contact details that are not set and the WhatsApp card without a number', async () => {
      const { element } = await render();

      expect(element.querySelector('a[href^="https://wa.me/"]')).toBeNull();
      expect(element.querySelector('a[href^="tel:"]')).toBeNull();
      expect(element.querySelector('a[href^="mailto:"]')).toBeNull();
      // الإجابات السريعة موجودة دايماً
      expect(element.querySelector('a[href="/orders"]')).not.toBeNull();
    });
  });

  describe('with the shop details filled in', () => {
    beforeEach(() =>
      setup([
        { provide: SHOP_WHATSAPP, useValue: '201012345678' },
        {
          provide: SITE_INFO,
          useValue: { ...emptySite, phone: '+20 100 123 4567', email: 'help@shop.test' },
        },
      ]),
    );

    it('shows the WhatsApp card with a ready message, and the phone and email', async () => {
      const { element } = await render();

      const link = element.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]')!;
      const url = new URL(link.href);
      expect(url.pathname).toBe('/201012345678');
      expect(url.searchParams.get('text')).toBe('Hello VoltCart, I have a question.');

      expect(element.querySelector('a[href="tel:+201001234567"]')).not.toBeNull();
      expect(element.querySelector('a[href="mailto:help@shop.test"]')).not.toBeNull();
    });
  });
});
