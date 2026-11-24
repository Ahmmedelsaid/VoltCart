import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable, finalize } from 'rxjs';
import { Cart, CartItem, MAX_QUANTITY_PER_ITEM } from '../../core/cart/cart.models';
import { CartService, cartErrorKey } from '../../core/cart/cart.service';
import { ApiError } from '../../core/models/api.models';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon } from '../../shared/ui/icon';

/** سلة العميل: تعديل الكميات، حذف منتج، والإجمالي. (إتمام الطلب هييجي مع Orders.) */
@Component({
  selector: 'app-cart',
  imports: [RouterLink, TranslocoPipe, PricePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      <h1 class="mb-6 text-3xl font-bold tracking-tight">{{ 'cart.title' | transloco }}</h1>

      @if (errorKey(); as key) {
        <p
          role="alert"
          class="mb-4 rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm"
        >
          {{ key | transloco }}
        </p>
      }

      @if (cart(); as current) {
        @if (current.items.length === 0) {
          <div
            class="grid place-items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-20 text-center"
          >
            <app-icon name="cart" [size]="2.5" class="text-muted/60" />
            <h2 class="text-lg font-semibold">{{ 'cart.emptyTitle' | transloco }}</h2>
            <p class="text-muted">{{ 'cart.emptyText' | transloco }}</p>
            <a routerLink="/products" class="btn btn-accent mt-1">{{
              'account.startShopping' | transloco
            }}</a>
          </div>
        } @else {
          <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <ul class="grid gap-3">
              @for (item of current.items; track item.productId) {
                <li
                  class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-2xl border bg-surface/60 p-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-4"
                  [class]="item.isAvailable ? 'border-border' : 'border-danger/50'"
                  [attr.aria-busy]="busyId() === item.productId"
                >
                  <a
                    [routerLink]="['/products', item.productId]"
                    class="relative grid aspect-square place-items-center overflow-hidden rounded-xl"
                    [class.bg-photo]="item.imageUrl"
                    [class.bg-surface-2]="!item.imageUrl"
                  >
                    @if (item.imageUrl) {
                      <img
                        [src]="item.imageUrl"
                        [alt]="item.name"
                        class="absolute inset-0 size-full object-contain p-2 mix-blend-multiply brightness-[1.07]"
                      />
                    } @else {
                      <app-icon name="box" [size]="2" class="text-muted/40" />
                    }
                  </a>

                  <div class="flex min-w-0 flex-col gap-2">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
                          {{ item.brandName }}
                        </p>
                        <a
                          [routerLink]="['/products', item.productId]"
                          class="line-clamp-2 font-semibold leading-snug hover:text-accent"
                        >
                          {{ item.name }}
                        </a>
                        <p class="mt-0.5 text-sm text-muted">{{ item.unitPrice | price }}</p>
                      </div>
                      <button
                        type="button"
                        class="btn !px-2 text-muted hover:text-danger"
                        [attr.aria-label]="'cart.remove' | transloco"
                        [disabled]="busyId() !== null"
                        (click)="remove(item)"
                      >
                        <app-icon name="trash" [size]="1.1" />
                      </button>
                    </div>

                    @if (!item.isAvailable) {
                      <p class="text-sm text-danger">
                        {{
                          (item.stockQuantity === 0 ? 'cart.unavailable' : 'cart.lowStock')
                            | transloco: { count: item.stockQuantity }
                        }}
                      </p>
                    }

                    <div class="mt-auto flex items-center justify-between gap-3">
                      <div
                        class="inline-flex items-center rounded-lg border border-border bg-surface"
                        role="group"
                        [attr.aria-label]="'cart.quantity' | transloco"
                      >
                        <button
                          type="button"
                          class="grid size-9 place-items-center rounded-s-lg transition hover:bg-surface-2 disabled:opacity-40"
                          [attr.aria-label]="'cart.decrease' | transloco"
                          [disabled]="busyId() !== null || item.quantity <= 1"
                          (click)="change(item, item.quantity - 1)"
                        >
                          <app-icon name="minus" [size]="1" />
                        </button>
                        <span class="min-w-8 text-center text-sm font-semibold" aria-live="polite">
                          {{ item.quantity }}
                        </span>
                        <button
                          type="button"
                          class="grid size-9 place-items-center rounded-e-lg transition hover:bg-surface-2 disabled:opacity-40"
                          [attr.aria-label]="'cart.increase' | transloco"
                          [disabled]="busyId() !== null || item.quantity >= maxFor(item)"
                          (click)="change(item, item.quantity + 1)"
                        >
                          <app-icon name="plus" [size]="1" />
                        </button>
                      </div>
                      <p class="font-bold" [class.text-muted]="!item.isAvailable">
                        {{ item.lineTotal | price }}
                      </p>
                    </div>
                  </div>
                </li>
              }
            </ul>

            <aside
              class="grid gap-4 rounded-2xl border border-border bg-surface/60 p-5 lg:sticky lg:top-24"
            >
              <h2 class="font-semibold">{{ 'cart.summary' | transloco }}</h2>
              <dl class="grid gap-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-muted">
                    {{ 'cart.items' | transloco: { count: current.itemCount } }}
                  </dt>
                  <dd>{{ current.subtotal | price }}</dd>
                </div>
                <div class="flex justify-between border-t border-border pt-3 text-base font-bold">
                  <dt>{{ 'cart.subtotal' | transloco }}</dt>
                  <dd class="text-accent">{{ current.subtotal | price }}</dd>
                </div>
              </dl>
              @if (hasUnavailable()) {
                <p class="text-xs text-danger">{{ 'cart.fixUnavailable' | transloco }}</p>
              }
              @if (hasUnavailable()) {
                <button type="button" class="btn btn-accent w-full" disabled>
                  {{ 'cart.checkout' | transloco }}
                </button>
              } @else {
                <a routerLink="/checkout" class="btn btn-accent w-full py-2.5">
                  {{ 'cart.checkout' | transloco }}
                </a>
              }
              <a routerLink="/products" class="btn w-full">{{ 'cart.continue' | transloco }}</a>
            </aside>
          </div>
        }
      } @else {
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-hidden="true">
          <div class="space-y-3">
            @for (placeholder of skeletons; track placeholder) {
              <div class="h-36 skeleton rounded-2xl border border-border"></div>
            }
          </div>
          <div class="h-56 skeleton rounded-2xl border border-border"></div>
        </div>
      }
    </div>
  `,
})
export class CartPage {
  private readonly cartService = inject(CartService);

  protected readonly cart = this.cartService.cart;
  protected readonly skeletons = [0, 1];

  /** المنتج اللي بنعدّله دلوقتي (بنعطّل باقي الأزرار لحد ما الرد يرجع). */
  protected readonly busyId = signal<number | null>(null);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly hasUnavailable = computed(
    () => this.cart()?.items.some((item) => !item.isAvailable) ?? false,
  );

  /** أقصى كمية مسموحة للمنتج: حد السلة أو المخزون، الأقل. */
  protected maxFor(item: CartItem): number {
    return Math.min(MAX_QUANTITY_PER_ITEM, item.stockQuantity);
  }

  protected change(item: CartItem, quantity: number): void {
    this.run(item.productId, this.cartService.setQuantity(item.productId, quantity));
  }

  protected remove(item: CartItem): void {
    this.run(item.productId, this.cartService.remove(item.productId));
  }

  private run(productId: number, request: Observable<Cart>): void {
    this.busyId.set(productId);
    this.errorKey.set(null);
    request.pipe(finalize(() => this.busyId.set(null))).subscribe({
      error: (error: ApiError) => this.errorKey.set(cartErrorKey(error)),
    });
  }
}
