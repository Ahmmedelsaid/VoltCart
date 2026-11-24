import { InjectionToken } from '@angular/core';

/**
 * بيانات التواصل المعروضة في الموقع (صفحة "اتصل بنا").
 * دي قيم تجريبية: بدّلها بالأرقام والعناوين الحقيقية قبل ما الموقع يتنشر.
 * (النصوص المترجمة زي العنوان ومواعيد العمل في public/i18n تحت contact.info)
 */
export const SITE = {
  name: 'VoltCart',
  email: 'support@voltcart.example',
  phone: '+20 100 000 0000',
  /**
   * رقم واتساب المتجر بالصيغة الدولية من غير + أو مسافات (مثلاً 201012345678).
   * فاضي = زرار "ابعت الطلب على واتساب" مخفي.
   */
  whatsapp: '',
} as const;

/** رقم واتساب المتجر كـ token، عشان الاختبارات تقدر تبدّله من غير mock للملف. */
export const SHOP_WHATSAPP = new InjectionToken<string>('SHOP_WHATSAPP', {
  providedIn: 'root',
  factory: () => SITE.whatsapp,
});
