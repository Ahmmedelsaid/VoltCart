import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subscription, finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { firstError } from '../../core/forms/form-errors';
import { GeocodingService, ReverseGeocode } from '../../core/geo/geocoding.service';
import {
  GOVERNORATES,
  LatLng,
  findGovernorate,
  matchGovernorate,
} from '../../core/geo/governorates';
import { LanguageService } from '../../core/i18n/language.service';
import { ApiError } from '../../core/models/api.models';
import { PHONE_PATTERN, PlaceOrderRequest } from '../../core/orders/order.models';
import { OrdersService, orderErrorKey } from '../../core/orders/orders.service';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon } from '../../shared/ui/icon';
import { LocationPicker } from '../../shared/ui/location-picker';

/** إتمام الطلب: بيانات المستلم، مكان التوصيل (محافظة + خريطة + عنوان)، الدفع، وملخص السلة. */
@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, PricePipe, Icon, LocationPicker],
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
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="grid gap-5">
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

              <section
                class="grid gap-4 rounded-2xl border border-border bg-surface/60 p-5 sm:p-6"
                aria-labelledby="co-contact-title"
              >
                <h2 id="co-contact-title" class="flex items-center gap-3 font-semibold">
                  <span class="step">1</span>
                  {{ 'checkout.sections.contact' | transloco }}
                </h2>

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
              </section>

              <section
                class="grid gap-4 rounded-2xl border border-border bg-surface/60 p-5 sm:p-6"
                aria-labelledby="co-delivery-title"
              >
                <h2 id="co-delivery-title" class="flex items-center gap-3 font-semibold">
                  <span class="step">2</span>
                  {{ 'checkout.sections.delivery' | transloco }}
                </h2>

                <div>
                  <label for="co-city" class="mb-1.5 block text-sm font-medium">
                    {{ 'checkout.fields.city' | transloco }}
                  </label>
                  <select
                    id="co-city"
                    formControlName="city"
                    autocomplete="address-level1"
                    class="field sm:max-w-xs"
                    [attr.aria-invalid]="cityError() ? 'true' : null"
                    [attr.aria-describedby]="cityError() ? 'co-city-error' : null"
                    (change)="onGovernorateChange()"
                  >
                    <option value="" disabled>
                      {{ 'checkout.fields.cityPlaceholder' | transloco }}
                    </option>
                    @for (governorate of governorates; track governorate.value) {
                      <option [value]="governorate.value">
                        {{ lang() === 'ar' ? governorate.ar : governorate.value }}
                      </option>
                    }
                  </select>
                  @if (cityError(); as key) {
                    <p id="co-city-error" class="mt-1.5 text-sm text-danger">
                      {{ key | transloco }}
                    </p>
                  }
                </div>

                <app-location-picker
                  [(position)]="pin"
                  [focus]="focus()"
                  (picked)="onPinPicked($event)"
                />

                <div>
                  <label for="co-address" class="mb-1.5 block text-sm font-medium">
                    {{ 'checkout.fields.address' | transloco }}
                  </label>
                  <textarea
                    id="co-address"
                    formControlName="address"
                    rows="2"
                    autocomplete="street-address"
                    class="field resize-y"
                    [attr.aria-invalid]="addressError() ? 'true' : null"
                    [attr.aria-describedby]="
                      addressError() ? 'co-address-error' : 'co-address-note'
                    "
                  ></textarea>
                  @if (addressError(); as key) {
                    <p id="co-address-error" class="mt-1.5 text-sm text-danger">
                      {{ key | transloco }}
                    </p>
                  } @else if (suggesting()) {
                    <p id="co-address-note" class="mt-1.5 text-xs text-muted">
                      {{ 'checkout.addressLooking' | transloco }}
                    </p>
                  } @else if (lookupFailed()) {
                    <p id="co-address-note" class="mt-1.5 text-xs text-muted">
                      {{ 'checkout.addressFailed' | transloco }}
                    </p>
                  } @else if (suggested()) {
                    <p id="co-address-note" class="mt-1.5 text-xs text-muted">
                      {{ 'checkout.addressFromMap' | transloco }}
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
                    rows="2"
                    class="field resize-y"
                  ></textarea>
                </div>
              </section>

              <section
                class="grid gap-3 rounded-2xl border border-border bg-surface/60 p-5 sm:p-6"
                aria-labelledby="co-payment-title"
              >
                <h2 id="co-payment-title" class="flex items-center gap-3 font-semibold">
                  <span class="step">3</span>
                  {{ 'checkout.sections.payment' | transloco }}
                </h2>
                <div
                  class="flex items-center gap-3 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm"
                >
                  <app-icon name="check" [size]="1.1" class="text-accent" />
                  <p>{{ 'checkout.cod' | transloco }}</p>
                </div>
              </section>

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
  private readonly geocoding = inject(GeocodingService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);

  protected readonly cart = this.cartService.cart;
  protected readonly lang = this.language.lang;
  protected readonly governorates = GOVERNORATES;
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
    city: ['', [Validators.required]],
    notes: ['', [Validators.maxLength(500)]],
  });

  /** الدبوس على الخريطة (اختياري) والمكان اللي الخريطة تفتح عليه. */
  protected readonly pin = signal<LatLng | null>(null);
  protected readonly focus = signal<LatLng | null>(null);

  protected readonly suggesting = signal(false);
  /** العنوان الحالي اتكتب تلقائياً من الدبوس ولسه العميل ما عدّلوش. */
  protected readonly suggested = signal(false);
  protected readonly lookupFailed = signal(false);
  private lastSuggestion = '';
  private lookup?: Subscription;

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly submitted = signal(false);

  constructor() {
    this.form.controls.address.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((value) => {
        if (value !== this.lastSuggestion) this.suggested.set(false);
      });
  }

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
      { required: 'checkout.validation.cityRequired' },
      control.touched || this.submitted(),
    );
  }

  /** العميل غيّر المحافظة بنفسه: الخريطة تروح لها، والدبوس القديم (كان في محافظة تانية) يتشال. */
  protected onGovernorateChange(): void {
    this.lookup?.unsubscribe();
    this.suggesting.set(false);
    this.pin.set(null);
    this.focus.set(findGovernorate(this.form.controls.city.value)?.center ?? null);
  }

  /** العميل حدّد مكان على الخريطة: نجيب اقتراح للمحافظة والعنوان. */
  protected onPinPicked(point: LatLng): void {
    this.lookup?.unsubscribe();
    this.suggesting.set(true);
    this.lookupFailed.set(false);
    this.lookup = this.geocoding
      .reverse(point.lat, point.lng, this.language.lang())
      .pipe(finalize(() => this.suggesting.set(false)))
      .subscribe({
        next: (result) => this.applySuggestion(result),
        // الاقتراح اختياري: لو فشل العميل يكتب العنوان بإيده، بس نقوله
        error: () => this.lookupFailed.set(true),
      });
  }

  private applySuggestion(result: ReverseGeocode): void {
    // الدبوس هو الحقيقة: المحافظة تتظبط عليه (من غير ما نحرّك الخريطة)
    const governorate = matchGovernorate(result.state, result.isoCode);
    if (governorate) this.form.controls.city.setValue(governorate.value);

    // ما نكتبش فوق عنوان العميل كتبه بنفسه
    const address = this.form.controls.address;
    if (result.address && (!address.value.trim() || address.value === this.lastSuggestion)) {
      this.lastSuggestion = result.address;
      address.setValue(result.address);
      this.suggested.set(true);
    }
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting() || this.hasUnavailable()) return;

    const value = this.form.getRawValue();
    const pin = this.pin();
    const request: PlaceOrderRequest = {
      ...value,
      notes: value.notes.trim() || null,
      latitude: pin ? round(pin.lat) : null,
      longitude: pin ? round(pin.lng) : null,
    };

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

/** 6 خانات عشرية (~10 سم) كفاية جداً. */
function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
