import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type Lang = 'ar' | 'en';

const STORAGE_KEY = 'voltcart.lang';

/**
 * مصدر الحقيقة للغة الحالية. لما تتغيّر:
 *  - بنبدّل لغة Transloco
 *  - بنظبط lang و dir على <html> (RTL للعربي و LTR للإنجليزي)
 *  - بنحفظ الاختيار في localStorage
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  readonly lang = signal<Lang>(this.initialLang());
  readonly dir = computed(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));
  /** الأرقام لاتينية حتى في العربي (الأشيع في مصر). */
  readonly locale = computed(() => (this.lang() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US'));

  constructor() {
    effect(() => {
      const lang = this.lang();
      this.transloco.setActiveLang(lang);
      this.document.documentElement.lang = lang;
      this.document.documentElement.dir = this.dir();
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // الـ storage ممكن يكون مقفول (private mode). مش مشكلة.
      }
    });
  }

  toggle(): void {
    this.lang.update((current) => (current === 'ar' ? 'en' : 'ar'));
  }

  private initialLang(): Lang {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {
      // نكمّل على لغة المتصفح
    }
    return navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  }
}
