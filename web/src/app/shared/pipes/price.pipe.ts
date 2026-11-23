import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/i18n/language.service';

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(locale: string): Intl.NumberFormat {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    formatters.set(locale, formatter);
  }
  return formatter;
}

/**
 * 35000 -> "35,000 ج.م." (عربي) أو "EGP 35,000" (إنجليزي).
 * impure لأنه بيقرا اللغة الحالية، ولازم يتحدّث لما اللغة تتبدّل.
 */
@Pipe({ name: 'price', pure: false })
export class PricePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: number): string {
    return formatterFor(this.language.locale()).format(value);
  }
}
