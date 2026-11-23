import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  /** مفتاح ترجمة (Transloco). */
  key: string;
  params?: Record<string, string | number>;
  /** رابط اختياري جوه الرسالة (زي "عرض السلة"). */
  action?: { key: string; link: string };
}

const MAX_VISIBLE = 3;
const DISMISS_AFTER_MS = 4500;

/** رسائل صغيرة بتظهر وتختفي لوحدها (إضافة للسلة، أخطاء...). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly items = signal<Toast[]>([]);
  readonly toasts = this.items.asReadonly();

  show(toast: Omit<Toast, 'id'>): void {
    const id = this.nextId++;
    this.items.update((list) => [...list, { ...toast, id }].slice(-MAX_VISIBLE));
    setTimeout(() => this.dismiss(id), DISMISS_AFTER_MS);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((toast) => toast.id !== id));
  }
}
