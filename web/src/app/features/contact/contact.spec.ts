import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Contact } from './contact';

class EmptyLoader implements TranslocoLoader {
  getTranslation() {
    return of({});
  }
}

const URL = `${environment.apiUrl}/contact`;

describe('Contact page', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [
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
  });

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

  function fillValid(element: HTMLElement): void {
    fill(element, 'ct-name', 'Ana Test');
    fill(element, 'ct-email', 'ana@example.com');
    fill(element, 'ct-subject', 'Order question');
    fill(element, 'ct-message', 'Where is my order? It was due yesterday.');
  }

  function submit(element: HTMLElement): void {
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
  }

  it('shows validation messages and sends nothing when the form is empty', async () => {
    const { fixture, element } = await render();
    submit(element);
    await fixture.whenStable();

    expect(element.querySelector('#ct-name-error')).not.toBeNull();
    expect(element.querySelector('#ct-email-error')).not.toBeNull();
    expect(element.querySelector('#ct-subject-error')).not.toBeNull();
    expect(element.querySelector('#ct-message-error')).not.toBeNull();
    http.expectNone(URL);
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
    http.expectNone(URL);
  });

  it('sends the message (optional phone as null, honeypot empty) and shows the thank-you', async () => {
    const { fixture, element } = await render();
    fillValid(element);
    submit(element);

    const post = http.expectOne(URL);
    expect(post.request.body).toEqual({
      name: 'Ana Test',
      email: 'ana@example.com',
      phone: null,
      subject: 'Order question',
      message: 'Where is my order? It was due yesterday.',
      website: '',
    });
    post.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('[role="status"]')).not.toBeNull();
  });

  it('tells the visitor when they sent too many messages (429)', async () => {
    const { fixture, element } = await render();
    fillValid(element);
    submit(element);

    http.expectOne(URL).flush(null, { status: 429, statusText: 'Too Many Requests' });
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(element.querySelector('form')).not.toBeNull();
  });
});
