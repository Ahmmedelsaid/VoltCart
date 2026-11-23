import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, map, of, switchMap } from 'rxjs';
import {
  Brand,
  Category,
  PRODUCT_SORTS,
  PagedResult,
  ProductListItem,
  ProductQuery,
} from '../../../core/models/api.models';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductsService } from '../../../core/services/products.service';
import { errorMessageKey } from '../../../core/state/error-message';
import { LoadState, toLoadState } from '../../../core/state/load-state';
import { Icon } from '../../../shared/ui/icon';
import { Pagination } from '../pagination/pagination';
import { ProductCard } from '../product-card/product-card';
import { ProductFilters } from '../product-filters/product-filters';
import { PAGE_SIZE, hasActiveFilters, isProductSort, toQuery, toUrlParams } from '../product-query';

@Component({
  selector: 'app-product-list',
  imports: [ProductCard, ProductFilters, Pagination, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      <header class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight">{{ 'products.title' | transloco }}</h1>
        <p class="mt-1 text-muted">{{ 'products.subtitle' | transloco }}</p>
      </header>

      <div class="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside [class]="filtersOpen() ? 'block' : 'hidden lg:block'">
          <app-product-filters
            [query]="query()"
            [categories]="categories()"
            [brands]="brands()"
            (patch)="update($event)"
            (cleared)="clear()"
          />
        </aside>

        <section [attr.aria-busy]="state().status === 'loading'">
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="btn lg:hidden"
              [attr.aria-expanded]="filtersOpen()"
              (click)="filtersOpen.set(!filtersOpen())"
            >
              <app-icon name="filter" [size]="1.1" />
              {{ (filtersOpen() ? 'filters.hide' : 'filters.show') | transloco }}
            </button>

            @let current = state();
            @if (current.status === 'ready') {
              <p class="text-sm text-muted" aria-live="polite">
                {{ 'products.count' | transloco: { count: current.data.totalCount } }}
              </p>
            }

            <label class="ms-auto flex items-center gap-2 text-sm">
              <span class="text-muted">{{ 'sort.label' | transloco }}</span>
              <select class="field !w-auto" (change)="onSort($event)">
                <option value="" [selected]="!query().sort">
                  {{ 'sort.default' | transloco }}
                </option>
                @for (sort of sorts; track sort) {
                  <option [value]="sort" [selected]="query().sort === sort">
                    {{ 'sort.' + sort | transloco }}
                  </option>
                }
              </select>
            </label>
          </div>

          @if (current.status === 'ready') {
            @if (current.data.items.length === 0) {
              <div
                class="grid place-items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center"
              >
                <app-icon name="box" [size]="2.5" class="text-muted/60" />
                <h2 class="text-lg font-semibold">{{ 'products.emptyTitle' | transloco }}</h2>
                <p class="text-muted">{{ 'products.emptyText' | transloco }}</p>
                @if (hasFilters()) {
                  <button type="button" class="btn btn-accent" (click)="clear()">
                    {{ 'products.clear' | transloco }}
                  </button>
                }
              </div>
            } @else {
              <ul class="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3">
                @for (product of current.data.items; track product.id) {
                  <li><app-product-card [product]="product" /></li>
                }
              </ul>
              <div class="mt-8">
                <app-pagination
                  [page]="current.data.page"
                  [totalPages]="current.data.totalPages"
                  (pageChange)="goToPage($event)"
                />
              </div>
            }
          } @else if (current.status === 'error') {
            <div
              role="alert"
              class="grid place-items-center gap-3 rounded-2xl border border-danger/40 bg-danger/5 px-6 py-14 text-center"
            >
              <h2 class="text-lg font-semibold">{{ 'errors.title' | transloco }}</h2>
              <p class="max-w-md text-muted">{{ errorKey(current.error) | transloco }}</p>
              <button type="button" class="btn btn-accent" (click)="retry()">
                {{ 'errors.retry' | transloco }}
              </button>
            </div>
          } @else {
            <ul
              class="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3"
              aria-hidden="true"
            >
              @for (placeholder of skeletons; track placeholder) {
                <li
                  class="aspect-[4/5] animate-pulse rounded-2xl border border-border bg-surface"
                ></li>
              }
            </ul>
          }
        </section>
      </div>
    </div>
  `,
})
export class ProductList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly products = inject(ProductsService);
  private readonly catalog = inject(CatalogService);
  private readonly scroller = inject(ViewportScroller);

  protected readonly sorts = PRODUCT_SORTS;
  protected readonly skeletons = Array.from({ length: PAGE_SIZE }, (_, i) => i);
  protected readonly filtersOpen = signal(false);

  /** الفلاتر الحالية، مقروءة من الـ URL. */
  protected readonly query = toSignal(this.route.queryParamMap.pipe(map(toQuery)), {
    initialValue: toQuery(this.route.snapshot.queryParamMap),
  });
  protected readonly hasFilters = computed(() => hasActiveFilters(this.query()));

  private readonly reload = signal(0);

  /** أي تغيير في الفلاتر (أو إعادة المحاولة) بيجيب البيانات من جديد. */
  protected readonly state = toSignal(
    toObservable(computed(() => ({ query: this.query(), reload: this.reload() }))).pipe(
      switchMap(({ query }) => this.products.list(query).pipe(toLoadState())),
    ),
    { initialValue: { status: 'loading' } as LoadState<PagedResult<ProductListItem>> },
  );

  protected readonly categories = toSignal(
    this.catalog.categories$.pipe(catchError(() => of<Category[]>([]))),
    { initialValue: [] as Category[] },
  );
  protected readonly brands = toSignal(
    this.catalog.brands$.pipe(catchError(() => of<Brand[]>([]))),
    { initialValue: [] as Brand[] },
  );

  protected readonly errorKey = errorMessageKey;

  /** أي تغيير في الفلتر بيرجّعنا للصفحة 1، والـ URL بيتحدّث. */
  protected update(patch: Partial<ProductQuery>): void {
    const next: ProductQuery = { ...this.query(), ...patch, page: patch.page ?? 1 };
    void this.router.navigate([], { queryParams: toUrlParams(next) });
  }

  protected clear(): void {
    void this.router.navigate([], {
      queryParams: this.query().sort ? { sort: this.query().sort } : {},
    });
  }

  protected goToPage(page: number): void {
    this.update({ page });
    this.scroller.scrollToPosition([0, 0]);
  }

  protected onSort(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.update({ sort: isProductSort(value) ? value : undefined });
  }

  protected retry(): void {
    this.reload.update((count) => count + 1);
  }
}
