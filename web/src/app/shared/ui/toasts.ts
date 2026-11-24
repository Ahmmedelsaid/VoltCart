import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ToastService } from '../../core/toast/toast.service';
import { Icon } from './icon';

/** مكان عرض الرسائل الصغيرة: أسفل الشاشة، وبيقراها قارئ الشاشة (aria-live). */
@Component({
  selector: 'app-toasts',
  imports: [RouterLink, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 bottom-4 z-40 mx-auto flex max-w-sm flex-col gap-2 px-4"
      aria-live="polite"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="animate-slide-up pointer-events-auto flex items-center gap-3 rounded-xl border bg-surface-2 px-4 py-3 text-sm shadow-xl"
          [class.border-success]="toast.kind === 'success'"
          [class.border-danger]="toast.kind === 'error'"
          [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
        >
          <app-icon
            [name]="toast.kind === 'success' ? 'check' : 'x'"
            [size]="1.1"
            [class]="toast.kind === 'success' ? 'text-success' : 'text-danger'"
          />
          <span class="flex-1">{{ toast.key | transloco: toast.params }}</span>
          @if (toast.action; as action) {
            <a
              [routerLink]="action.link"
              class="font-semibold text-accent hover:underline"
              (click)="toastService.dismiss(toast.id)"
            >
              {{ action.key | transloco }}
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class Toasts {
  protected readonly toastService = inject(ToastService);
}
