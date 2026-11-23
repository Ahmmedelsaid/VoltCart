import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  const setActiveLang = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    setActiveLang.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: TranslocoService, useValue: { setActiveLang } }],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('uses the saved language', () => {
    localStorage.setItem('voltcart.lang', 'en');
    const service = TestBed.inject(LanguageService);

    expect(service.lang()).toBe('en');
    expect(service.dir()).toBe('ltr');
    expect(service.locale()).toBe('en-US');
  });

  it('falls back to the browser language when nothing is saved', () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('ar-EG');
    expect(TestBed.inject(LanguageService).lang()).toBe('ar');
  });

  it('defaults to English for other browser languages', () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-FR');
    expect(TestBed.inject(LanguageService).lang()).toBe('en');
  });

  it('toggling updates direction, <html>, storage and Transloco', () => {
    localStorage.setItem('voltcart.lang', 'ar');
    const service = TestBed.inject(LanguageService);
    TestBed.tick();

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(service.locale()).toBe('ar-EG-u-nu-latn');

    service.toggle();
    TestBed.tick();

    expect(service.lang()).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('voltcart.lang')).toBe('en');
    expect(setActiveLang).toHaveBeenLastCalledWith('en');
  });
});
