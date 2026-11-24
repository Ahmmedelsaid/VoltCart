import { InjectionToken } from '@angular/core';

/** نص بلغتين (الموقع عربي وإنجليزي). فاضي = الحقل مش بيظهر. */
export interface LocalizedText {
  ar: string;
  en: string;
}

/**
 * بيانات التواصل اللي بتظهر في صفحة "اتصل بنا". كل حقل فاضي بيتخفّى من الصفحة،
 * عشان ما نعرضش بيانات وهمية. املاها ببيانات المتجر الحقيقية قبل ما الموقع يتنشر.
 */
export interface SiteInfo {
  name: string;
  /** إيميل الدعم اللي يظهر للزوّار (مش بالضرورة إيميل استلام الرسايل). */
  email: string;
  /** تليفون المتجر زي ما تحب يظهر، مثلاً +20 100 123 4567. */
  phone: string;
  /**
   * رقم واتساب المتجر بالصيغة الدولية من غير + أو مسافات (مثلاً 201012345678).
   * بيفعّل كارت "كلّمنا على واتساب" وزرار "ابعت طلبي على واتساب".
   */
  whatsapp: string;
  address: LocalizedText;
  hours: LocalizedText;
}

export const SITE: SiteInfo = {
  name: 'VoltCart',
  email: '',
  phone: '',
  whatsapp: '',
  address: { ar: '', en: '' },
  hours: { ar: '', en: '' },
};

/** نفس البيانات كـ token، عشان الاختبارات تبدّلها من غير mock للملف. */
export const SITE_INFO = new InjectionToken<SiteInfo>('SITE_INFO', {
  providedIn: 'root',
  factory: () => SITE,
});

/** رقم واتساب المتجر كـ token (بيستخدمه زرار الطلب كمان). */
export const SHOP_WHATSAPP = new InjectionToken<string>('SHOP_WHATSAPP', {
  providedIn: 'root',
  factory: () => SITE.whatsapp,
});
