import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { firstError } from '../../core/forms/form-errors';
import { ApiError } from '../../core/models/api.models';
import { PHONE_PATTERN, PlaceOrderRequest } from '../../core/orders/order.models';
import { OrdersService, orderErrorKey } from '../../core/orders/orders.service';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon } from '../../shared/ui/icon';

/** إتمام الطلب: بيانات التوصيل + ملخص السلة. الدفع عند الاستلام. */
@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, PricePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      <h1 class="mb-6 text-3xl font-bold tracking-tight">{{ 'checkout.title' | transloco }}</h1>

      @if (cart(); as current) {
        @if (current.items.length === 0) {
          <div
            class="grid place-items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-20 text-center"
          >
            <app-icon name="cart" [size]="2.5" class="text-muted/60" />
            <h2 class="text-lg font-semibold">{{ 'cart.emptyTitle' | transloco }}</h2>
            <a routerLink="/" class="btn btn-accent mt-1">{{
              'account.startShopping' | transloco
            }}</a>
          </div>
        } @else {
          <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <form
              [formGroup]="form"
              (ngSubmit)="submit()"
              novalidate
              class="grid gap-4 rounded-2xl border border-border bg-surface/60 p-5 sm:p-6"
            >
              <h2 class="font-semibold">{{ 'checkout.shipping' | transloco }}</h2>

              @if (serverError(); as key) {
                <p
                  role="alert"
                  class="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                >
                  {{ key | transloco }}
                  @if (key === 'checkout.errors.stock') {
                    <a routerLink="/cart" class="ms-1 font-semibold underline">
                      {{ 'cart.view' | transloco }}
                    </a>
                  }
                </p>
              }

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="co-name" class="mb-1.5 block text-sm font-medium">
                    {{ 'checkout.fields.name' | transloco }}
                  </label>
                  <input
                    id="co-name"
                    formControlName="shippingName"
                    autocomplete="name"
                    class="field"
                    [attr.aria-invalid]="nameError() ? 'true' : null"
                    [attr.aria-describedby]="nameError() ? 'co-name-error' : null"
                  />
                  @if (nameError(); as key) {
                    <p id="co-name-error" class="mt-1.5 text-sm text-danger">
                      {{ key | transloco }}
                    </p>
                  }
                </div>

                <div>
                  <label for="co-phone" class="mb-1.5 block text-sm font-medium">
                    {{ 'checkout.fields.phone' | transloco }}
                  </label>
                  <input
                    id="co-phone"
                    type="tel"
                    formControlName="phone"
                    autocomplete="tel"
                    inputmode="tel"
                    dir="ltr"
                    class="field"
                    placeholder="+20 100 123 4567"
                    [attr.aria-invalid]="phoneError() ? 'true' : null"
                    [attr.aria-describedby]="phoneError() ? 'co-phone-error' : null"
                  />
                  @if (phoneError(); as key) {
                    <p id="co-phone-error" class="mt-1.5 text-sm text-danger">
                      {{ key | transloco }}
                    </p>
                  }
                </div>
              </div>

              <div>
                <label for="co-address" class="mb-1.5 block text-sm font-medium">
                  {{ 'checkout.fields.address' | transloco }}
                </label>
                <input
                  id="co-address"
                  formControlName="address"
                  autocomplete="street-address"
                  class="field"
                  [attr.aria-invalid]="addressError() ? 'true' : null"
                  [attr.aria-describedby]="addressError() ? 'co-address-error' : null"
                />
                @if (addressError(); as key) {
                  <p id="co-address-error" class="mt-1.5 text-sm text-danger">
                    {{ key | transloco }}
                  </p>
                }
              </div>

              <div>
                <label for="co-city" class="mb-1.5 block text-sm font-medium">
                  {{ 'checkout.fields.city' | transloco }}
                </label>
                <input
                  id="co-city"
                  formControlName="city"
                  autocomplete="address-level2"
                  class="field sm:max-w-xs"
                  [attr.aria-invalid]="cityError() ? 'true' : null"
                  [attr.aria-describedby]="cityError() ? 'co-city-error' : null"
                />
                @if (cityError(); as key) {
                  <p id="co-city-error" class="mt-1.5 text-sm text-danger">
                    {{ key | transloco }}
                  </p>
                }
              </div>

              <div>
                <label for="co-notes" class="mb-1.5 block text-sm font-medium">
                  {{ 'checkout.fields.notes' | transloco }}
                  <span class="font-normal text-muted"
                    >({{ 'checkout.optional' | transloco }})</span
                  >
                </label>
                <textarea
                  id="co-notes"
                  formControlName="notes"
                  rows="3"
                  class="field resize-y"
                ></textarea>
              </div>

              <div class="rounded-xl border border-border bg-bg/40 px-4 py-3 text-sm">
                <p class="font-semibold">{{ 'checkout.payment' | transloco }}</p>
                <p class="mt-0.5 text-muted">{{ 'checkout.cod' | transloco }}</p>
              </div>

              <button
                type="submit"
                class="btn btn-accent w-full py-3 text-base lg:hidden"
                [disabled]="submitting() || hasUnavailable()"
              >
                {{ (submitting() ? 'checkout.placing' : 'checkout.place') | transloco }}
              </button>
            </form>

            <aside
              class="grid gap-4 rounded-2xl border border-border bg-surface/60 p-5 lg:sticky lg:top-24"
            >
              <h2 class="font-semibold">{{ 'cart.summary' | transloco }}</h2>
              <ul class="grid gap-3">
                @for (item of current.items; track item.productId) {
                  <li class="flex items-center gap-3">
                    <div
                      class="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg"
                      [class.bg-photo]="item.imageUrl"
                      [class.bg-surface-2]="!item.imageUrl"
                    >
                      @if (item.imageUrl) {
                        <img
                          [src]="item.imageUrl"
                          [alt]="item.name"
                          class="absolute inset-0 size-full object-contain p-1 mix-blend-multiply"
                        />
                      } @else {
                        <app-icon name="box" [size]="1.4" class="text-muted/40" />
                      }
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="line-clamp-1 text-sm font-medium">{{ item.name }}</p>
                      <p class="text-xs text-muted">
                        {{ item.unitPrice | price }} × {{ item.quantity }}
                      </p>
                    </div>
                    <p class="text-sm font-semibold" [class.text-muted]="!item.isAvailable">
                      {{ item.lineTotal | price }}
                    </p>
                  </li>
                }
              </ul>

              <dl class="grid gap-2 border-t border-border pt-3 text-sm">
                <div class="flex justify-between text-base font-bold">
                  <dt>{{ 'cart.subtotal' | transloco }}</dt>
                  <dd class="text-accent">{{ current.subtotal | price }}</dd>
                </div>
                <p class="text-xs text-muted">{{ 'checkout.shippingNote' | transloco }}</p>
              </dl>

              @if (hasUnavailable()) {
                <p class="text-xs text-danger">
                  {{ 'cart.fixUnavailable' | transloco }}
                  <a routerLink="/cart" class="font-semibold underline">
                    {{ 'cart.view' | transloco }}
                  </a>
                </p>
              }

              <button
                type="button"
                class="btn btn-accent hidden w-full py-3 text-base lg:inline-flex"
                [disabled]="submitting() || hasUnavailable()"
                (click)="submit()"
              >
                {{ (submitting() ? 'checkout.placing' : 'checkout.place') | transloco }}
              </button>
              <a routerLink="/cart" class="btn w-full">{{ 'checkout.backToCart' | transloco }}</a>
            </aside>
          </div>
        }
      } @else {
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]" aria-hidden="true">
          <div class="h-96 animate-pulse rounded-2xl border border-border bg-surface"></div>
          <div class="h-72 animate-pulse rounded-2xl border border-border bg-surface"></div>
        </div>
      }
    </div>
  `,
})
export class Checkout {
  private readonly auth = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly orders = inject(OrdersService);
  private readonly router = inject(Router);

  protected readonly cart = this.cartService.cart;
  protected readonly hasUnavailable = computed(
    () => this.cart()?.items.some((item) => !item.isAvailable) ?? false,
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
    shippingName: [
      this.auth.user()?.fullName ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    notes: ['', [Validators.maxLength(500)]],
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly submitted = signal(false);

  protected nameError(): string | null {
    const control = this.form.controls.shippingName;
    return firstError(
      control,
      { required: 'checkout.validation.nameRequired', minlength: 'checkout.validation.nameShort' },
      control.touched || this.submitted(),
    );
  }

  protected phoneError(): string | null {
    const control = this.form.controls.phone;
    return firstError(
      control,
      {
        required: 'checkout.validation.phoneRequired',
        pattern: 'checkout.validation.phoneInvalid',
      },
      control.touched || this.submitted(),
    );
  }

  protected addressError(): string | null {
    const control = this.form.controls.address;
    return firstError(
      control,
      {
        required: 'checkout.validation.addressRequired',
        minlength: 'checkout.validation.addressShort',
      },
      control.touched || this.submitted(),
    );
  }

  protected cityError(): string | null {
    const control = this.form.controls.city;
    return firstError(
      control,
      { required: 'checkout.validation.cityRequired', minlength: 'checkout.validation.cityShort' },
      control.touched || this.submitted(),
    );
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting() || this.hasUnavailable()) return;

    const value = this.form.getRawValue();
    const request: PlaceOrderRequest = { ...value, notes: value.notes.trim() || null };

    this.submitting.set(true);
    this.serverError.set(null);

    this.orders.place(request).subscribe({
      next: (order) =>
        void this.router.navigate(['/orders', order.id], { queryParams: { placed: 1 } }),
      error: (error: ApiError) => {
        this.submitting.set(false);
        this.serverError.set(orderErrorKey(error));
        // المخزون اتغيّر: نجيب السلة تاني عشان تبان المنتجات اللي مش متاحة
        if (error.status === 409) this.cartService.reload();
      },
    });
  }
}
