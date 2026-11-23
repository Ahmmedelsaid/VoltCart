import { AbstractControl } from '@angular/forms';

/**
 * أول خطأ في الـ control بيرجّع مفتاح ترجمته، لو المفروض نعرضه (المستخدم لمس الحقل أو ضغط إرسال).
 * الترتيب في messages هو أولوية الأخطاء.
 */
export function firstError(
  control: AbstractControl,
  messages: Record<string, string>,
  show: boolean,
): string | null {
  if (!show || control.valid) return null;

  for (const [code, key] of Object.entries(messages)) {
    if (control.hasError(code)) return key;
  }
  return null;
}

/** حرف واحد كبير من الاسم، لأيقونة الحساب. */
export function initialOf(name: string | undefined): string {
  return (name?.trim().charAt(0) || '?').toUpperCase();
}
