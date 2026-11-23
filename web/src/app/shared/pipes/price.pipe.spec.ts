import { TestBed } from '@angular/core/testing';
import { LanguageService } from '../../core/i18n/language.service';
import { PricePipe } from './price.pipe';

function pipeFor(locale: string): PricePipe {
  TestBed.configureTestingModule({
    providers: [PricePipe, { provide: LanguageService, useValue: { locale: () => locale } }],
  });
  return TestBed.inject(PricePipe);
}

describe('PricePipe', () => {
  it('formats prices in English with the EGP currency', () => {
    const text = pipeFor('en-US').transform(35000);
    expect(text).toContain('35,000');
    expect(text).toContain('EGP');
  });

  it('formats prices in Arabic with Latin digits and ج.م', () => {
    const text = pipeFor('ar-EG-u-nu-latn').transform(35000);
    expect(text).toContain('35,000');
    expect(text).toContain('ج.م');
  });

  it('keeps decimals only when they exist', () => {
    const pipe = pipeFor('en-US');
    expect(pipe.transform(999.5)).toContain('999.5');
    expect(pipe.transform(1000)).not.toContain('.');
  });
});
