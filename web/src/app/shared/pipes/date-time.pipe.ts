import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/i18n/language.service';

/**
 * "2026-11-23T16:49:11" -> "23 Nov 2026, 6:49 PM" بلغة الصفحة وبتوقيت الجهاز.
 * الـ API بيرجّع UTC من غير علامة Z، فبنضيفها.
 * impure لأنه بيقرا اللغة الحالية.
 */
@Pipe({ name: 'dateTime', pure: false })
export class DateTimePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: string | null | undefined): string {
    if (!value) return '';
    const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(this.language.locale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }
}
