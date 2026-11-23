import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { of, switchMap } from 'rxjs';
import { ApiError } from '../../core/models/api.models';
import { Order } from '../../core/orders/order.models';
import { OrdersService, orderErrorKey } from '../../core/orders/orders.service';
import { LoadState, toLoadState } from '../../core/state/load-state';
import { DateTimePipe } from '../../shared/pipes/date-time.pipe';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon } from '../../shared/ui/icon';
import { OrderStatusBadge } from '../../shared/ui/order-status';

/** تفاصيل طلب: المنتجات، بيانات التوصيل، وإلغاء الطلب لو لسه متاخدش في التنفيذ. */
@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, TranslocoPipe, PricePipe, DateTimePipe, Icon, OrderStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl px-4 py-8">
      @let current = state();

      @if (current.status === 'ready') {
        @let order = shown() ?? current.data;

        @if (placed() === '1' && order.status === 'Placed') {
          <div
            role="status"
            class="mb-6 flex items-start gap-3 rounded-2xl border border-success/50 bg-success/10 p-4"
          >
            <app-icon name="check" [size]="1.4" class="mt-0.5 text-success" />
            <div>
              <h2 class="font-semibold">{{ 'orders.placedTitle' | transloco }}</h2>
              <p class="text-sm text-muted">{{ 'orders.placedText' | transloco }}</p>
            </div>
          </div>
        }

        <header class="mb-6 flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-bold tracking-tight">
            {{ 'orders.number' | transloco: { id: order.id } }}
          </h1>
          <app-order-status [status]="order.status" />
          <p class="w-full text-sm text-muted">{{ order.createdAt | dateTime }}</p>
        </header>

        @if (errorKey(); as key) {
          <p
            role="alert"
            class="mb-4 rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm"
          >
            {{ key | transloco }}
          </p>
        }

        <div class="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
          <ul class="grid gap-3">
            @for (item of order.items; track item.productId) {
              <li
                class="flex items-center gap-4 rounded-2xl border border-border bg-surface/60 p-3"
              >
                <a
                  [routerLink]="['/products', item.productId]"
                  class="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl"
                  [class.bg-photo]="item.imageUrl"
                  [class.bg-surface-2]="!item.imageUrl"
                >
                  @if (item.imageUrl) {
                    <img
                      [src]="item.imageUrl"
                      [alt]="item.name"
                      class="absolute inset-0 size-full object-contain p-1.5 mix-blend-multiply"
                    />
                  } @else {
                    <app-icon name="box" [size]="1.6" class="text-muted/40" />
                  }
                </a>
                <div class="min-w-0 flex-1">
                  <a
                    [routerLink]="['/products', item.productId]"
                    class="line-clamp-2 font-medium hover:text-accent"
                  >
                    {{ item.name }}
                  </a>
                  <p class="text-sm text-muted">
                    {{ item.unitPrice | price }} × {{ item.quantity }}
                  </p>
                </div>
                <p class="font-bold">{{ item.lineTotal | price }}</p>
              </li>
            }
          </ul>

          <aside class="grid gap-4">
            <section class="grid gap-2 rounded-2xl border border-border bg-surface/60 p-5">
              <h2 class="font-semibold">{{ 'checkout.shipping' | transloco }}</h2>
              <p class="text-sm">{{ order.shippingName }}</p>
              <p class="text-sm text-muted" dir="ltr">{{ order.phone }}</p>
              <p class="text-sm text-muted">{{ order.address }}, {{ order.city }}</p>
              @if (order.notes) {
                <p class="text-sm text-muted">{{ order.notes }}</p>
              }
            </section>

            <section class="grid gap-2 rounded-2xl border border-border bg-surface/60 p-5">
              <h2 class="font-semibold">{{ 'checkout.payment' | transloco }}</h2>
              <p class="text-sm text-muted">{{ 'checkout.cod' | transloco }}</p>
              <p class="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>{{ 'orders.total' | transloco }}</span>
                <span class="text-accent">{{ order.total | price }}</span>
              </p>
            </section>

            @if (order.status === 'Placed') {
              @if (confirming()) {
                <div class="grid gap-2 rounded-2xl border border-danger/40 bg-danger/5 p-4">
                  <p class="text-sm">{{ 'orders.cancelConfirm' | transloco }}</p>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="btn flex-1 !border-danger !text-danger"
                      [disabled]="cancelling()"
                      (click)="cancel(order)"
                    >
                      {{ (cancelling() ? 'orders.cancelling' : 'orders.cancelYes') | transloco }}
                    </button>
                    <button
                      type="button"
                      class="btn flex-1"
                      [disabled]="cancelling()"
                      (click)="confirming.set(false)"
                    >
                      {{ 'orders.cancelNo' | transloco }}
                    </button>
                  </div>
                </div>
              } @else {
                <button type="button" class="btn" (click)="confirming.set(true)">
                  {{ 'orders.cancel' | transloco }}
                </button>
              }
            }
          </aside>
        </div>

        <a routerLink="/orders" class="btn mt-8">
          <app-icon name="chevron-left" [size]="1" class="rtl:rotate-180" />
          {{ 'orders.all' | transloco }}
        </a>
      } @else if (current.status === 'error') {
        <div
          role="alert"
          class="mx-auto grid max-w-lg place-items-center gap-3 rounded-2xl border border-danger/40 bg-danger/5 px-6 py-14 text-center"
        >
          <h1 class="text-lg font-semibold">{{ 'orders.notFoundTitle' | transloco }}</h1>
          <p class="text-muted">{{ loadErrorKey() | transloco }}</p>
          <a routerLink="/orders" class="btn">{{ 'orders.all' | transloco }}</a>
        </div>
      } @else {
        <div class="grid gap-4" aria-hidden="true">
          <div class="h-10 w-64 animate-pulse rounded bg-surface"></div>
          <div class="h-40 animate-pulse rounded-2xl bg-surface"></div>
        </div>
      }
    </div>
  `,
})
export class OrderDetail {
  /** من الـ route (orders/:id) و ?placed=1 بعد إتمام الطلب، بفضل withComponentInputBinding. */
  readonly id = input.required<string>();
  readonly placed = input<string>();

  private readonly orders = inject(OrdersService);

  /** الطلب بعد الإلغاء (الرد الجديد من الـ API بيحل محل النسخة المحمّلة). */
  protected readonly shown = signal<Order | null>(null);
  protected readonly confirming = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) => {
        const orderId = Number(id);
        if (!Number.isInteger(orderId) || orderId < 1) {
          return of<LoadState<Order>>({
            status: 'error',
            error: { status: 404, title: 'Not found' },
          });
        }
        this.shown.set(null);
        return this.orders.get(orderId).pipe(toLoadState());
      }),
    ),
    { initialValue: { status: 'loading' } as LoadState<Order> },
  );

  protected readonly loadErrorKey = computed(() => {
    const current = this.state();
    return current.status === 'error' ? orderErrorKey(current.error) : '';
  });

  protected cancel(order: Order): void {
    this.cancelling.set(true);
    this.errorKey.set(null);
    this.orders.cancel(order.id).subscribe({
      next: (updated) => {
        this.shown.set(updated);
        this.cancelling.set(false);
        this.confirming.set(false);
      },
      error: (error: ApiError) => {
        this.cancelling.set(false);
        this.confirming.set(false);
        this.errorKey.set(
          error.status === 409 ? 'orders.errors.cannotCancel' : orderErrorKey(error),
        );
      },
    });
  }
}
