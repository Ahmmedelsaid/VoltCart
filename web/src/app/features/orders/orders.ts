import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { switchMap } from 'rxjs';
import { OrderSummary } from '../../core/orders/order.models';
import { OrdersService, orderErrorKey } from '../../core/orders/orders.service';
import { LoadState, toLoadState } from '../../core/state/load-state';
import { DateTimePipe } from '../../shared/pipes/date-time.pipe';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon } from '../../shared/ui/icon';
import { OrderStatusBadge } from '../../shared/ui/order-status';

/** سجل طلبات العميل (الأحدث أولًا). */
@Component({
  selector: 'app-orders',
  imports: [RouterLink, TranslocoPipe, PricePipe, DateTimePipe, Icon, OrderStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl px-4 py-8">
      <h1 class="mb-6 text-3xl font-bold tracking-tight">{{ 'orders.title' | transloco }}</h1>

      @let current = state();
      @if (current.status === 'ready') {
        @if (current.data.length === 0) {
          <div
            class="grid place-items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center"
          >
            <app-icon name="box" [size]="2.5" class="text-muted/60" />
            <p class="text-muted">{{ 'account.noOrders' | transloco }}</p>
            <a routerLink="/" class="btn btn-accent">{{ 'account.startShopping' | transloco }}</a>
          </div>
        } @else {
          <ul class="grid gap-3">
            @for (order of current.data; track order.id) {
              <li>
                <a
                  [routerLink]="['/orders', order.id]"
                  class="flex items-center gap-4 rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-accent/50"
                >
                  <!-- عرض ثابت عشان النص ما يتزحزحش من طلب للتاني. على الموبايل صورة واحدة بس -->
                  <div
                    class="flex w-12 shrink-0 -space-x-3 sm:w-[7.5rem] rtl:space-x-reverse"
                    aria-hidden="true"
                  >
                    @for (url of order.imageUrls; track $index) {
                      <span
                        class="relative size-12 shrink-0 overflow-hidden rounded-lg border-2 border-surface bg-photo"
                        [class]="$index === 0 ? '' : 'hidden sm:block'"
                      >
                        <img
                          [src]="url"
                          alt=""
                          class="absolute inset-0 size-full object-contain p-1 mix-blend-multiply"
                        />
                      </span>
                    } @empty {
                      <span class="grid size-12 place-items-center rounded-lg bg-surface-2">
                        <app-icon name="box" [size]="1.3" class="text-muted/50" />
                      </span>
                    }
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="flex flex-wrap items-center gap-2 font-semibold">
                      {{ 'orders.number' | transloco: { id: order.id } }}
                      <app-order-status [status]="order.status" />
                    </p>
                    <p class="text-sm text-muted">{{ order.createdAt | dateTime }}</p>
                    <p class="text-xs text-muted">
                      {{ 'cart.items' | transloco: { count: order.itemCount } }}
                    </p>
                  </div>
                  <p class="font-bold">{{ order.total | price }}</p>
                  <app-icon name="chevron-right" [size]="1.1" class="text-muted rtl:rotate-180" />
                </a>
              </li>
            }
          </ul>
        }
      } @else if (current.status === 'error') {
        <div
          role="alert"
          class="grid place-items-center gap-3 rounded-2xl border border-danger/40 bg-danger/5 px-6 py-14 text-center"
        >
          <h2 class="text-lg font-semibold">{{ 'errors.title' | transloco }}</h2>
          <p class="text-muted">{{ errorKey(current.error) | transloco }}</p>
          <button type="button" class="btn btn-accent" (click)="reload.set(reload() + 1)">
            {{ 'errors.retry' | transloco }}
          </button>
        </div>
      } @else {
        <div class="grid gap-3" aria-hidden="true">
          @for (placeholder of skeletons; track placeholder) {
            <div class="h-20 animate-pulse rounded-2xl border border-border bg-surface"></div>
          }
        </div>
      }
    </div>
  `,
})
export class Orders {
  private readonly orders = inject(OrdersService);

  protected readonly skeletons = [0, 1, 2];
  protected readonly reload = signal(0);
  protected readonly errorKey = orderErrorKey;

  protected readonly state = toSignal(
    toObservable(this.reload).pipe(switchMap(() => this.orders.list().pipe(toLoadState()))),
    { initialValue: { status: 'loading' } as LoadState<OrderSummary[]> },
  );
}
