import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { App } from './app';

class TestLoader implements TranslocoLoader {
  getTranslation() {
    return of({
      nav: { skip: 'Skip to content', products: 'Products' },
      footer: { rights: '© {{year}} VoltCart' },
      lang: { switchTo: 'English' },
    });
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: { availableLangs: ['ar', 'en'], defaultLang: 'ar' },
          loader: TestLoader,
        }),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the header, the main outlet and a language switch', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-header')).toBeTruthy();
    expect(element.querySelector('main#main')).toBeTruthy();
    expect(element.textContent).toContain('Cart');
    expect(element.querySelector('button')).toBeTruthy();
  });
});
