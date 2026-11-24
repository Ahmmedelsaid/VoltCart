import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { prefersReducedMotion } from './reveal';

/**
 * بيعدّ من 0 للرقم لما العنصر يظهر على الشاشة:
 *   <span [appCountUp]="167" suffix="+"></span>
 * من غير IntersectionObserver أو مع "تقليل الحركة" بيعرض الرقم النهائي مباشرة.
 */
@Directive({ selector: '[appCountUp]' })
export class CountUp {
  readonly appCountUp = input.required<number>();
  readonly suffix = input('');
  readonly duration = input(1400);

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly visible = signal(false);
  /** من غير حركة (مفيش IntersectionObserver أو "تقليل الحركة"): الرقم النهائي مباشرة. */
  private readonly instant = signal(false);
  private frame = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => cancelAnimationFrame(this.frame));

    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
        this.instant.set(true);
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.visible.set(true);
          observer.disconnect();
        }
      });
      observer.observe(this.element);
      destroyRef.onDestroy(() => observer.disconnect());
    });

    effect(() => {
      const target = this.appCountUp();
      const suffix = this.suffix();
      const render = (value: number) => {
        this.element.textContent = `${Math.round(value)}${suffix}`;
      };

      if (this.instant() || typeof requestAnimationFrame === 'undefined') {
        render(target);
        return;
      }
      if (!this.visible()) {
        render(0);
        return;
      }

      cancelAnimationFrame(this.frame);
      const start = performance.now();
      const duration = this.duration();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        render(target * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    });
  }
}
