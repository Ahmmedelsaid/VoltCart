import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { OrderStatus } from '../../core/orders/order.models';

/** شارة حالة الطلب (ملوّنة + نص، فاللون مش هو الوسيلة الوحيدة للتمييز). */
@Component({
  selector: 'app-order-status',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      [class]="status() === 'Cancelled' ? 'bg-danger/15 text-danger' : 'bg-accent/15 text-accent'"
    >
      {{ 'orders.status.' + status() | transloco }}
    </span>
  `,
})
export class OrderStatusBadge {
  readonly status = input.required<OrderStatus>();
}
