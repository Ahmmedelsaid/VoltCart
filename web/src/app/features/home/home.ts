import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { GOVERNORATES } from '../../core/geo/governorates';
import { Brand, Category, PagedResult, ProductListItem } from '../../core/models/api.models';
import { CatalogService } from '../../core/services/catalog.service';
import { ProductsService } from '../../core/services/products.service';
import { LoadState, toLoadState } from '../../core/state/load-state';
import { CountUp } from '../../shared/directives/count-up';
import { Reveal } from '../../shared/directives/reveal';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon, IconName } from '../../shared/ui/icon';
import { ProductCard } from '../products/product-card/product-card';

interface CategorySection {
  category: Category;
  items: ProductListItem[];
}

/** الأقسام الأكبر الأول (أكتر منتجات)، عشان الصفحة الرئيسية تبدأ بالأهم. */
function byPopularity(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => b.productCount - a.productCount);
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
  if (slug.includes('camera')) return 'camera';
  if (slug.includes('gaming') || slug.includes('game')) return 'gamepad';
  if (slug.includes('tablet')) return 'tablet';
  if (slug.includes('wearable') || slug.includes('watch')) return 'watch';
  if (slug.includes('tv') || slug.includes('display') || slug.includes('monitor')) return 'tv';
  return 'box';
}

/** الصفحة الرئيسية: بانر، مميزات، أقسام، وصل حديثاً، منتجات كل قسم، وأشهر الماركات. */
@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslocoPipe, PricePipe, Icon, ProductCard, Reveal, CountUp],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4 pb-4 pt-6">
      <section aria-labelledby="hero-title">
        <div
          class="relative isolate overflow-hidden rounded-[2rem] bg-[#1e3a8a] text-white shadow-glow"
        >
          <!-- خلفية متحركة: تدرّج + فقاعات ضوء بتتحرك ببطء + نقط شبكة -->
          <div
            aria-hidden="true"
            class="absolute inset-0 -z-10 bg-linear-to-br from-[#1d4ed8] via-accent to-[#1e3a8a]"
          ></div>
          <div
            aria-hidden="true"
            class="animate-blob absolute -start-24 -top-28 -z-10 size-[28rem] rounded-full bg-[#60a5fa]/45 blur-3xl"
          ></div>
          <div
            aria-hidden="true"
            class="animate-blob absolute -bottom-36 end-1/4 -z-10 size-[26rem] rounded-full bg-[#a78bfa]/35 blur-3xl [animation-delay:-7s]"
          ></div>
          <div
            aria-hidden="true"
            class="animate-blob absolute -end-24 top-1/4 -z-10 size-80 rounded-full bg-highlight/25 blur-3xl [animation-delay:-13s]"
          ></div>
          <div
            aria-hidden="true"
            class="absolute inset-0 -z-10 opacity-[0.14] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
          ></div>

          <div
            class="grid items-center gap-10 px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-[1.05fr_1fr]"
          >
            <div>
              <p
                class="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide ring-1 ring-white/25 backdrop-blur"
              >
                <app-icon name="bolt" [size]="0.9" class="text-highlight" />
                {{ 'home.eyebrow' | transloco }}
              </p>
              <h1
                id="hero-title"
                class="animate-fade-up mt-5 max-w-xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight [animation-delay:90ms] sm:text-6xl"
              >
                <span class="text-gradient">{{ 'home.title' | transloco }}</span>
              </h1>
              <p
                class="animate-fade-up mt-5 max-w-lg text-base text-white/85 [animation-delay:180ms] sm:text-lg"
              >
                {{ 'home.subtitle' | transloco }}
              </p>

              <div class="animate-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:270ms]">
                <a
                  routerLink="/products"
                  class="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-accent shadow-[0_14px_30px_-12px_rgb(0_0_0/0.5)] transition duration-200 hover:-translate-y-0.5 hover:bg-accent-soft active:scale-[0.98]"
                >
                  {{ 'home.shopNow' | transloco }}
                  <app-icon
                    name="chevron-right"
                    [size]="1.1"
                    class="transition group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                  />
                </a>
                <a
                  routerLink="/products"
                  [queryParams]="{ sort: 'newest' }"
                  class="inline-flex items-center rounded-xl bg-white/10 px-6 py-3.5 text-sm font-semibold text-white ring-1 ring-white/35 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/20"
                >
                  {{ 'home.newArrivals' | transloco }}
                </a>
              </div>

              <dl
                class="animate-fade-up mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/20 pt-6 [animation-delay:360ms]"
              >
                <div>
                  <dt class="sr-only">{{ 'home.stats.products' | transloco }}</dt>
                  <dd class="text-3xl font-extrabold tabular-nums">
                    <span
                      dir="ltr"
                      class="inline-block"
                      [appCountUp]="totalProducts()"
                      suffix="+"
                    ></span>
                  </dd>
                  <p class="text-xs text-white/75" aria-hidden="true">
                    {{ 'home.stats.products' | transloco }}
                  </p>
                </div>
                <div>
                  <dt class="sr-only">{{ 'home.stats.categories' | transloco }}</dt>
                  <dd class="text-3xl font-extrabold tabular-nums">
                    <span
                      dir="ltr"
                      class="inline-block"
                      [appCountUp]="subCategories().length"
                    ></span>
                  </dd>
                  <p class="text-xs text-white/75" aria-hidden="true">
                    {{ 'home.stats.categories' | transloco }}
                  </p>
                </div>
                <div>
                  <dt class="sr-only">{{ 'home.stats.governorates' | transloco }}</dt>
                  <dd class="text-3xl font-extrabold tabular-nums">
                    <span dir="ltr" class="inline-block" [appCountUp]="governorateCount"></span>
                  </dd>
                  <p class="text-xs text-white/75" aria-hidden="true">
                    {{ 'home.stats.governorates' | transloco }}
                  </p>
                </div>
              </dl>
            </div>

            @if (heroProducts().length) {
              <ul class="hidden grid-cols-2 gap-4 lg:grid">
                @for (product of heroProducts(); track product.id; let i = $index) {
                  <li [class.mt-10]="i % 2 === 1" [class.-mt-2]="i % 2 === 0">
                    <a
                      [routerLink]="['/products', product.id]"
                      class="animate-float group block rounded-3xl bg-white/95 p-3.5 text-fg shadow-[0_24px_48px_-20px_rgb(2_6_23/0.7)] ring-1 ring-white/60 backdrop-blur transition-[box-shadow] duration-300 hover:[animation-play-state:paused] hover:shadow-[0_30px_60px_-18px_rgb(2_6_23/0.85)]"
                      [style.--tilt]="tilts[i]"
                      [style.animation-delay]="-i * 1.8 + 's'"
                    >
                      <div
                        class="relative grid aspect-[16/11] place-items-center overflow-hidden rounded-2xl bg-photo"
                      >
                        @if (product.imageUrl) {
                          <img
                            [src]="product.imageUrl"
                            [alt]="product.name"
                            class="absolute inset-0 size-full object-contain p-2 mix-blend-multiply transition duration-500 group-hover:scale-110"
                          />
                        }
                      </div>
                      <p class="mt-3 line-clamp-1 text-sm font-semibold">{{ product.name }}</p>
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
          @for (value of values; track value.key; let i = $index) {
            <li
              [appReveal]="i * 80"
              class="card group flex items-center gap-3 p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span
                class="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-fg"
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
          <h2 id="cats-title" appReveal class="section-title mb-5">
            {{ 'home.shopByCategory' | transloco }}
          </h2>
          <ul class="flex flex-wrap justify-center gap-3 sm:gap-4">
            @for (category of subCategories(); track category.id; let i = $index) {
              <li
                [appReveal]="(i % 5) * 70"
                class="w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(20%-0.8rem)]"
              >
                <a
                  routerLink="/products"
                  [queryParams]="{ categoryId: category.id }"
                  class="card group relative flex h-full flex-col items-center gap-3 overflow-hidden p-5 text-center transition duration-300 hover:-translate-y-1.5 hover:border-transparent hover:bg-linear-to-br hover:from-[#3b82f6] hover:to-accent-hover hover:text-white hover:shadow-glow"
                >
                  <span
                    class="grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:bg-white/20 group-hover:text-white"
                  >
                    <app-icon [name]="iconFor(category)" [size]="2" />
                  </span>
                  <span class="font-semibold">{{ category.name }}</span>
                  <span class="text-xs text-muted transition group-hover:text-white/80">
                    {{ 'home.products' | transloco: { count: category.productCount } }}
                  </span>
                </a>
              </li>
            }
          </ul>
        </section>
      }

      <section aria-labelledby="new-title">
        <div appReveal class="mb-5 flex items-end justify-between gap-3">
          <h2 id="new-title" class="section-title">{{ 'home.newArrivals' | transloco }}</h2>
          <a
            routerLink="/products"
            [queryParams]="{ sort: 'newest' }"
            class="group inline-flex items-center gap-1 text-sm font-semibold text-accent"
          >
            {{ 'home.viewAll' | transloco }}
            <app-icon
              name="chevron-right"
              [size]="1"
              class="transition group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
            />
          </a>
        </div>
        @let current = newest();
        @if (current.status === 'ready') {
          <ul class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            @for (product of current.data.items; track product.id; let i = $index) {
              <li [appReveal]="(i % 4) * 80"><app-product-card [product]="product" /></li>
            }
          </ul>
        } @else if (current.status === 'loading') {
          <ul class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-hidden="true">
            @for (placeholder of skeletons; track placeholder) {
              <li class="card skeleton aspect-[4/5]"></li>
            }
          </ul>
        }
      </section>

      @for (section of sections(); track section.category.id) {
        <section [attr.aria-label]="section.category.name">
          <div appReveal class="mb-5 flex items-end justify-between gap-3">
            <h2 class="section-title">{{ section.category.name }}</h2>
            <a
              routerLink="/products"
              [queryParams]="{ categoryId: section.category.id }"
              class="group inline-flex items-center gap-1 text-sm font-semibold text-accent"
            >
              {{ 'home.viewAll' | transloco }}
              <app-icon
                name="chevron-right"
                [size]="1"
                class="transition group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
              />
            </a>
          </div>
          <ul class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            @for (product of section.items; track product.id; let i = $index) {
              <li [appReveal]="(i % 4) * 80"><app-product-card [product]="product" /></li>
            }
          </ul>
        </section>
      }

      @if (brands().length) {
        <section aria-labelledby="brands-title">
          <h2 id="brands-title" appReveal class="section-title mb-5">
            {{ 'home.topBrands' | transloco }}
          </h2>
          <!-- شريط ماركات بيلفّ لوحده (بيقف لما تقف عليه). dir=ltr عشان اتجاه الحركة ثابت -->
          <div
            dir="ltr"
            class="overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
          >
            <ul class="animate-marquee flex w-max gap-4 hover:[animation-play-state:paused]">
              @for (brand of marqueeBrands(); track $index) {
                <li [attr.aria-hidden]="$index >= brands().length ? 'true' : null">
                  <a
                    routerLink="/products"
                    [queryParams]="{ brandId: brand.id }"
                    [attr.tabindex]="$index >= brands().length ? -1 : null"
                    class="card flex min-w-40 items-center justify-center px-8 py-5 text-xl font-extrabold tracking-tight text-muted/80 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:text-accent hover:shadow-lift"
                  >
                    {{ brand.name }}
                  </a>
                </li>
              }
            </ul>
          </div>
        </section>
      }
    </div>
  `,
})
export class Home {
  private readonly products = inject(ProductsService);
  private readonly catalog = inject(CatalogService);

  protected readonly skeletons = Array.from({ length: 8 }, (_, i) => i);
  /** ميل خفيف لكل كارت في البانر (بيتطبّق جوه حركة الطفو). */
  protected readonly tilts = ['-4deg', '3deg', '2.5deg', '-3deg'];
  protected readonly governorateCount = GOVERNORATES.length;
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
      map((brands) => brands.filter((brand) => brand.productCount > 0).slice(0, 14)),
      catchError(() => of<Brand[]>([])),
    ),
    { initialValue: [] as Brand[] },
  );

  protected readonly subCategories = computed(() =>
    byPopularity(this.categories().filter((category) => category.parentId !== null)),
  );

  /** عدد المنتجات الكلي (من نتيجة "وصل حديثاً") لعدّاد البانر. */
  protected readonly totalProducts = computed(() => {
    const current = this.newest();
    return current.status === 'ready' ? current.data.totalCount : 0;
  });

  /** الماركات مرتين ورا بعض، عشان الشريط يلفّ من غير فجوة. */
  protected readonly marqueeBrands = computed(() => [...this.brands(), ...this.brands()]);

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
        byPopularity(
          categories.filter((category) => category.parentId !== null && category.productCount > 0),
        ).slice(0, 3),
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
