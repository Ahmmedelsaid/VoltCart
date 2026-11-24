import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/** المستخدم طلب "تقليل الحركة"؟ (أو المتصفح مش بيدعم matchMedia، زي الاختبارات). */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * العنصر بيبدأ مخفي ومزحزح لتحت، وبيظهر بنعومة لما يدخل الشاشة (مرة واحدة).
 * القيمة اختيارية: تأخير بالمللي ثانية، عشان العناصر المتجاورة تظهر ورا بعض:
 *   <li [appReveal]="i * 70">
 * من غير IntersectionObserver (اختبارات) أو مع "تقليل الحركة" بيظهر فوراً.
 */
@Directive({
  selector: '[appReveal]',
  host: { class: 'reveal' },
})
export class Reveal {
  readonly appReveal = input<number | ''>(0);

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const delay = Number(this.appReveal()) || 0;
      if (delay > 0) element.style.setProperty('--reveal-delay', `${Math.min(delay, 600)}ms`);

      if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
        element.classList.add('is-visible');
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            element.classList.add('is-visible');
            observer.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
      );
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
