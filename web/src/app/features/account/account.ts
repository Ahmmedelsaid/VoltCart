import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { initialOf } from '../../core/forms/form-errors';
import { OrderSummary } from '../../core/orders/order.models';
import { OrdersService } from '../../core/orders/orders.service';
import { DateTimePipe } from '../../shared/pipes/date-time.pipe';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon } from '../../shared/ui/icon';
import { OrderStatusBadge } from '../../shared/ui/order-status';

/** صفحة العميل: بياناته وطلباته. (مفيش dashboard للأدمن في الواجهة دي.) */
@Component({
  selector: 'app-account',
  imports: [RouterLink, TranslocoPipe, PricePipe, DateTimePipe, Icon, OrderStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.user(); as user) {
      <section class="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <header class="flex items-center gap-4">
          <div
            class="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-2xl font-bold text-accent-fg"
            aria-hidden="true"
          >
            {{ initial() }}
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-2xl font-bold tracking-tight">
              {{ 'account.greeting' | transloco: { name: firstName() } }}
            </h1>
            <p class="truncate text-muted" dir="ltr">{{ user.email }}</p>
          </div>
        </header>

        <div class="grid gap-4 sm:grid-cols-2">
          <section class="rounded-2xl border border-border bg-surface/60 p-5">
            <h2 class="mb-3 font-semibold">{{ 'account.profile' | transloco }}</h2>
            <dl class="grid gap-3 text-sm">
              <div>
                <dt class="text-muted">{{ 'account.name' | transloco }}</dt>
                <dd class="mt-0.5 font-medium">{{ user.fullName }}</dd>
              </div>
              <div>
                <dt class="text-muted">{{ 'account.email' | transloco }}</dt>
                <dd class="mt-0.5 font-medium" dir="ltr">{{ user.email }}</dd>
              </div>
            </dl>
          </section>

          <section
            class="grid content-start gap-3 rounded-2xl border border-border bg-surface/60 p-5"
          >
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-semibold">{{ 'account.orders' | transloco }}</h2>
              @if (recentOrders().length) {
                <a routerLink="/orders" class="text-sm font-medium text-accent hover:underline">
                  {{ 'orders.all' | transloco }}
                </a>
              }
            </div>

            @if (recentOrders().length) {
              <ul class="grid gap-2">
                @for (order of recentOrders(); track order.id) {
                  <li>
                    <a
                      [routerLink]="['/orders', order.id]"
                      class="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg/40 px-3 py-2.5 text-sm transition hover:border-accent/50"
                    >
                      <span class="min-w-0">
                        <span class="flex flex-wrap items-center gap-2 font-medium">
                          {{ 'orders.number' | transloco: { id: order.id } }}
                          <app-order-status [status]="order.status" />
                        </span>
                        <span class="text-xs text-muted">{{ order.createdAt | dateTime }}</span>
                      </span>
                      <span class="font-semibold">{{ order.total | price }}</span>
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <div class="grid justify-items-center gap-2 py-4 text-center">
                <app-icon name="box" [size]="2.2" class="text-muted/50" />
                <p class="text-sm text-muted">{{ 'account.noOrders' | transloco }}</p>
                <a routerLink="/products" class="btn btn-accent mt-1">
                  {{ 'account.startShopping' | transloco }}
                </a>
              </div>
            }
          </section>
        </div>
      </section>
    }
  `,
})
export class Account {
  protected readonly auth = inject(AuthService);

  private readonly orders = toSignal(
    inject(OrdersService)
      .list()
      .pipe(catchError(() => of<OrderSummary[]>([]))),
    { initialValue: [] as OrderSummary[] },
  );

  /** آخر 3 طلبات (الباقي في صفحة "طلباتي"). */
  protected readonly recentOrders = computed(() => this.orders().slice(0, 3));

  protected readonly initial = computed(() => initialOf(this.auth.user()?.fullName));
  protected readonly firstName = computed(
    () => this.auth.user()?.fullName.trim().split(/\s+/)[0] ?? '',
  );
}
