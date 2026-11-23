import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { of, switchMap } from 'rxjs';
import { CartService } from '../../../core/cart/cart.service';
import { ProductDetails } from '../../../core/models/api.models';
import { ProductsService } from '../../../core/services/products.service';
import { errorMessageKey } from '../../../core/state/error-message';
import { LoadState, toLoadState } from '../../../core/state/load-state';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { Icon } from '../../../shared/ui/icon';

const LOW_STOCK_THRESHOLD = 10;

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, TranslocoPipe, PricePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      @let current = state();

      @if (current.status === 'ready') {
        @let product = current.data;

        <nav
          class="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted"
          aria-label="breadcrumb"
        >
          <a routerLink="/" class="transition hover:text-fg">{{ 'detail.home' | transloco }}</a>
          <app-icon name="chevron-right" [size]="0.9" class="rtl:rotate-180" />
          <span>{{ product.categoryName }}</span>
          <app-icon name="chevron-right" [size]="0.9" class="rtl:rotate-180" />
          <span class="text-fg">{{ product.name }}</span>
        </nav>

        <div class="grid gap-8 lg:grid-cols-2">
          <div
            class="relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-border lg:sticky lg:top-24 lg:self-start"
            [class.bg-photo]="product.imageUrl"
            [class.bg-linear-to-br]="!product.imageUrl"
            [class.from-surface-2]="!product.imageUrl"
            [class.to-bg]="!product.imageUrl"
          >
            @if (product.imageUrl) {
              <img
                [src]="product.imageUrl"
                [alt]="product.name"
                class="absolute inset-0 size-full object-contain p-8 mix-blend-multiply brightness-[1.07]"
              />
            } @else {
              <app-icon name="box" [size]="7" class="text-muted/40" />
            }
          </div>

          <div class="flex flex-col gap-5">
            <div>
              <p class="text-sm text-muted">{{ product.brandName }}</p>
              <h1 class="mt-1 text-3xl font-bold leading-tight tracking-tight">
                {{ product.name }}
              </h1>
            </div>

            <div class="grid gap-3 rounded-2xl border border-border bg-surface/60 p-5">
              <p class="text-4xl font-bold tracking-tight text-accent">
                {{ product.price | price }}
              </p>

              <div class="flex flex-wrap items-center gap-3 text-sm">
                @if (product.stockQuantity === 0) {
                  <span class="rounded-full bg-danger/15 px-3 py-1 font-medium text-danger">
                    {{ 'stock.out' | transloco }}
                  </span>
                } @else if (product.stockQuantity <= lowStock) {
                  <span class="rounded-full bg-accent/15 px-3 py-1 font-medium text-accent">
                    {{ 'stock.low' | transloco: { count: product.stockQuantity } }}
                  </span>
                } @else {
                  <span class="rounded-full bg-success/15 px-3 py-1 font-medium text-success">
                    {{ 'stock.in' | transloco }}
                  </span>
                }
                <span class="text-muted"
                  >{{ 'detail.sku' | transloco }}: <bdi>{{ product.sku }}</bdi></span
                >
              </div>
            </div>

            <button
              type="button"
              class="btn btn-accent !py-3 text-base"
              [disabled]="product.stockQuantity === 0 || cart.addingProductId() === product.id"
              (click)="cart.addFromCatalog(product.id)"
            >
              <app-icon name="cart" [size]="1.2" />
              {{ 'cart.add' | transloco }}
            </button>

            <section>
              <h2 class="mb-2 font-semibold">{{ 'detail.description' | transloco }}</h2>
              <p class="leading-relaxed text-muted">
                {{ product.description || ('detail.noDescription' | transloco) }}
              </p>
            </section>

            @if (specEntries().length) {
              <section>
                <h2 class="mb-2 font-semibold">{{ 'detail.specs' | transloco }}</h2>
                <dl class="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  @for (spec of specEntries(); track spec.key) {
                    <div class="flex justify-between gap-4 bg-surface/60 px-4 py-3 text-sm">
                      <dt class="text-muted">{{ specLabel(spec.key) }}</dt>
                      <dd class="font-medium">
                        <bdi>{{ spec.value }}</bdi>
                      </dd>
                    </div>
                  }
                </dl>
              </section>
            }

            <a routerLink="/" class="btn mt-2 self-start">
              <app-icon name="chevron-left" [size]="1" class="rtl:rotate-180" />
              {{ 'detail.back' | transloco }}
            </a>
          </div>
        </div>
      } @else if (current.status === 'error') {
        <div
          role="alert"
          class="mx-auto grid max-w-lg place-items-center gap-3 rounded-2xl border border-danger/40 bg-danger/5 px-6 py-14 text-center"
        >
          <h1 class="text-lg font-semibold">
            {{
              (current.error.status === 404 ? 'detail.notFoundTitle' : 'errors.title') | transloco
            }}
          </h1>
          <p class="text-muted">{{ errorKey(current.error) | transloco }}</p>
          <div class="flex gap-2">
            @if (current.error.status !== 404) {
              <button type="button" class="btn btn-accent" (click)="retry()">
                {{ 'errors.retry' | transloco }}
              </button>
            }
            <a routerLink="/" class="btn">{{ 'detail.back' | transloco }}</a>
          </div>
        </div>
      } @else {
        <div class="grid gap-8 lg:grid-cols-2" aria-hidden="true">
          <div class="aspect-square animate-pulse rounded-3xl bg-surface"></div>
          <div class="space-y-4">
            <div class="h-4 w-24 animate-pulse rounded bg-surface"></div>
            <div class="h-9 w-3/4 animate-pulse rounded bg-surface"></div>
            <div class="h-9 w-40 animate-pulse rounded bg-surface"></div>
            <div class="h-32 animate-pulse rounded bg-surface"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProductDetail {
  /** بيجي من الـ route (products/:id) بفضل withComponentInputBinding */
  readonly id = input.required<string>();

  protected readonly cart = inject(CartService);
  private readonly products = inject(ProductsService);
  private readonly transloco = inject(TranslocoService);
  private readonly title = inject(Title);
  private readonly reload = signal(0);

  protected readonly lowStock = LOW_STOCK_THRESHOLD;
  protected readonly errorKey = errorMessageKey;

  protected readonly state = toSignal(
    toObservable(computed(() => ({ id: this.id(), reload: this.reload() }))).pipe(
      switchMap(({ id }) => {
        const productId = Number(id);
        if (!Number.isInteger(productId) || productId < 1) {
          // رابط زي /products/abc: مفيش داعي نكلّم الـ API
          return of<LoadState<ProductDetails>>({
            status: 'error',
            error: { status: 404, title: 'Not found' },
          });
        }
        return this.products.get(productId).pipe(toLoadState());
      }),
    ),
    { initialValue: { status: 'loading' } as LoadState<ProductDetails> },
  );

  protected readonly specEntries = computed(() => {
    const current = this.state();
    return current.status === 'ready'
      ? Object.entries(current.data.specs).map(([key, value]) => ({ key, value }))
      : [];
  });

  constructor() {
    effect(() => {
      const current = this.state();
      if (current.status === 'ready') this.title.setTitle(`${current.data.name} | VoltCart`);
    });
    inject(DestroyRef).onDestroy(() => this.title.setTitle('VoltCart'));
  }

  /** لو المفتاح له ترجمة بنستخدمها، وإلا بنعرضه بشكل مقروء (noise_cancelling -> Noise cancelling). */
  protected specLabel(key: string): string {
    const path = `specs.${key}`;
    const label = this.transloco.translate(path);
    if (label !== path) return label;
    const readable = key.replaceAll('_', ' ');
    return readable.charAt(0).toUpperCase() + readable.slice(1);
  }

  protected retry(): void {
    this.reload.update((count) => count + 1);
  }
}
