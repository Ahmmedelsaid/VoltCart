import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Brand, Category, PagedResult, ProductListItem } from '../../core/models/api.models';
import { CatalogService } from '../../core/services/catalog.service';
import { ProductsService } from '../../core/services/products.service';
import { LoadState, toLoadState } from '../../core/state/load-state';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon, IconName } from '../../shared/ui/icon';
import { ProductCard } from '../products/product-card/product-card';

interface CategorySection {
  category: Category;
  items: ProductListItem[];
}

/** أيقونة لكل قسم بناءً على الـ slug، وأيقونة صندوق لأي قسم جديد. */
function iconFor(category: Category): IconName {
  const slug = category.slug.toLowerCase();
  if (slug.includes('phone') || slug.includes('mobile')) return 'phone';
  if (slug.includes('laptop') || slug.includes('computer')) return 'laptop';
  if (slug.includes('audio') || slug.includes('headphone') || slug.includes('speaker')) {
    return 'headphones';
  }
  if (slug.includes('accessor')) return 'plug';
  return 'box';
}

/** الصفحة الرئيسية: بانر، مميزات، أقسام، وصل حديثاً، منتجات كل قسم، وأشهر الماركات. */
@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslocoPipe, PricePipe, Icon, ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto grid max-w-7xl gap-12 px-4 pb-4 pt-6">
      <section aria-labelledby="hero-title">
        <div
          class="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-accent via-[#1d4ed8] to-[#1e3a8a] text-white shadow-lift"
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -end-24 -top-24 -z-10 size-96 rounded-full bg-white/10 blur-2xl"
          ></div>
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -bottom-32 start-1/3 -z-10 size-80 rounded-full bg-highlight/20 blur-3xl"
          ></div>
          <app-icon
            name="bolt"
            [size]="18"
            class="pointer-events-none absolute -end-8 -top-8 -z-10 text-white opacity-[0.07]"
          />

          <div
            class="grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.1fr_1fr]"
          >
            <div>
              <p
                class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide"
              >
                <app-icon name="bolt" [size]="0.9" class="text-highlight" />
                {{ 'home.eyebrow' | transloco }}
              </p>
              <h1
                id="hero-title"
                class="mt-4 max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              >
                {{ 'home.title' | transloco }}
              </h1>
              <p class="mt-4 max-w-lg text-base text-white/85 sm:text-lg">
                {{ 'home.subtitle' | transloco }}
              </p>
              <div class="mt-7 flex flex-wrap gap-3">
                <a
                  routerLink="/products"
                  class="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-accent shadow-lg transition hover:bg-accent-soft active:scale-[0.98]"
                >
                  {{ 'home.shopNow' | transloco }}
                  <app-icon name="chevron-right" [size]="1.1" class="rtl:-scale-x-100" />
                </a>
                <a
                  routerLink="/products"
                  [queryParams]="{ sort: 'newest' }"
                  class="inline-flex items-center rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {{ 'home.newArrivals' | transloco }}
                </a>
              </div>
            </div>

            @if (heroProducts().length) {
              <ul class="hidden grid-cols-2 gap-3 lg:grid" aria-hidden="false">
                @for (product of heroProducts(); track product.id) {
                  <li>
                    <a
                      [routerLink]="['/products', product.id]"
                      class="group block rounded-2xl bg-white p-3 text-fg shadow-lg transition hover:-translate-y-1"
                    >
                      <div class="relative grid aspect-[4/3] place-items-center overflow-hidden">
                        @if (product.imageUrl) {
                          <img
                            [src]="product.imageUrl"
                            [alt]="product.name"
                            class="absolute inset-0 size-full object-contain p-1 transition duration-300 group-hover:scale-105"
                          />
                        }
                      </div>
                      <p class="mt-2 line-clamp-1 text-sm font-semibold">{{ product.name }}</p>
                      <p class="text-sm font-bold text-accent">{{ product.price | price }}</p>
                    </a>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      </section>

      <section aria-label="Highlights">
        <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          @for (value of values; track value.key) {
            <li class="card flex items-center gap-3 p-4">
              <span
                class="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"
              >
                <app-icon [name]="value.icon" [size]="1.4" />
              </span>
              <div>
                <p class="text-sm font-semibold">
                  {{ 'home.values.' + value.key + '.title' | transloco }}
                </p>
                <p class="text-xs text-muted">
                  {{ 'home.values.' + value.key + '.text' | transloco }}
                </p>
              </div>
            </li>
          }
        </ul>
      </section>

      @if (subCategories().length) {
        <section aria-labelledby="cats-title">
          <h2 id="cats-title" class="section-title mb-4">
            {{ 'home.shopByCategory' | transloco }}
          </h2>
          <ul class="grid grid-cols-2 gap-3 md:grid-cols-4">
            @for (category of subCategories(); track category.id) {
              <li>
                <a
                  routerLink="/products"
                  [queryParams]="{ categoryId: category.id }"
                  class="card group flex flex-col items-center gap-3 p-5 text-center transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lift"
                >
                  <span
                    class="grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-accent-fg"
                  >
                    <app-icon [name]="iconFor(category)" [size]="2" />
                  </span>
                  <span class="font-semibold">{{ category.name }}</span>
                  <span class="text-xs text-muted">
                    {{ 'home.products' | transloco: { count: category.productCount } }}
                  </span>
                </a>
              </li>
            }
          </ul>
        </section>
      }

      <section aria-labelledby="new-title">
        <div class="mb-4 flex items-end justify-between gap-3">
          <h2 id="new-title" class="section-title">{{ 'home.newArrivals' | transloco }}</h2>
          <a
            routerLink="/products"
            [queryParams]="{ sort: 'newest' }"
            class="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
          >
            {{ 'home.viewAll' | transloco }}
            <app-icon name="chevron-right" [size]="1" class="rtl:-scale-x-100" />
          </a>
        </div>
        @let current = newest();
        @if (current.status === 'ready') {
          <ul class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            @for (product of current.data.items; track product.id) {
              <li><app-product-card [product]="product" /></li>
            }
          </ul>
        } @else if (current.status === 'loading') {
          <ul class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-hidden="true">
            @for (placeholder of skeletons; track placeholder) {
              <li class="card aspect-[4/5] animate-pulse"></li>
            }
          </ul>
        }
      </section>

      @for (section of sections(); track section.category.id) {
        <section [attr.aria-label]="section.category.name">
          <div class="mb-4 flex items-end justify-between gap-3">
            <h2 class="section-title">{{ section.category.name }}</h2>
            <a
              routerLink="/products"
              [queryParams]="{ categoryId: section.category.id }"
              class="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
            >
              {{ 'home.viewAll' | transloco }}
              <app-icon name="chevron-right" [size]="1" class="rtl:-scale-x-100" />
            </a>
          </div>
          <ul class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            @for (product of section.items; track product.id) {
              <li><app-product-card [product]="product" /></li>
            }
          </ul>
        </section>
      }

      @if (brands().length) {
        <section aria-labelledby="brands-title">
          <h2 id="brands-title" class="section-title mb-4">{{ 'home.topBrands' | transloco }}</h2>
          <ul class="flex flex-wrap gap-3">
            @for (brand of brands(); track brand.id) {
              <li>
                <a
                  routerLink="/products"
                  [queryParams]="{ brandId: brand.id }"
                  class="card flex min-w-32 items-center justify-center px-6 py-4 text-lg font-bold tracking-tight text-muted transition hover:border-accent/50 hover:text-accent hover:shadow-lift"
                >
                  {{ brand.name }}
                </a>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
})
export class Home {
  private readonly products = inject(ProductsService);
  private readonly catalog = inject(CatalogService);

  protected readonly skeletons = Array.from({ length: 8 }, (_, i) => i);
  protected readonly iconFor = iconFor;
  protected readonly values: { key: string; icon: IconName }[] = [
    { key: 'cod', icon: 'cash' },
    { key: 'delivery', icon: 'truck' },
    { key: 'warranty', icon: 'shield' },
    { key: 'support', icon: 'headset' },
  ];

  protected readonly newest = toSignal(
    this.products.list({ sort: 'newest', pageSize: 8 }).pipe(toLoadState()),
    { initialValue: { status: 'loading' } as LoadState<PagedResult<ProductListItem>> },
  );

  private readonly categories = toSignal(
    this.catalog.categories$.pipe(catchError(() => of<Category[]>([]))),
    { initialValue: [] as Category[] },
  );

  protected readonly brands = toSignal(
    this.catalog.brands$.pipe(
      map((brands) => brands.filter((brand) => brand.productCount > 0).slice(0, 8)),
      catchError(() => of<Brand[]>([])),
    ),
    { initialValue: [] as Brand[] },
  );

  protected readonly subCategories = computed(() =>
    this.categories().filter((category) => category.parentId !== null),
  );

  /** أول 4 منتجات وصلت حديثاً بصورها في البانر. */
  protected readonly heroProducts = computed(() => {
    const current = this.newest();
    return current.status === 'ready'
      ? current.data.items.filter((item) => item.imageUrl).slice(0, 4)
      : [];
  });

  /** صف منتجات لأول 3 أقسام فيها منتجات. */
  protected readonly sections = toSignal(
    this.catalog.categories$.pipe(
      map((categories) =>
        categories
          .filter((category) => category.parentId !== null && category.productCount > 0)
          .slice(0, 3),
      ),
      switchMap((categories) =>
        categories.length === 0
          ? of<CategorySection[]>([])
          : forkJoin(
              categories.map((category) =>
                this.products
                  .list({ categoryId: category.id, pageSize: 4 })
                  .pipe(map((result) => ({ category, items: result.items }))),
              ),
            ),
      ),
      catchError(() => of<CategorySection[]>([])),
    ),
    { initialValue: [] as CategorySection[] },
  );
}
