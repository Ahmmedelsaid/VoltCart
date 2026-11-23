import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Brand, Category, ProductQuery } from '../../../core/models/api.models';
import { Icon } from '../../../shared/ui/icon';
import { hasActiveFilters } from '../product-query';

const optionBase =
  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm transition';

@Component({
  selector: 'app-product-filters',
  imports: [TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 rounded-2xl border border-border bg-surface/60 p-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">{{ 'filters.title' | transloco }}</h2>
        @if (hasFilters()) {
          <button
            type="button"
            class="text-sm text-accent hover:underline"
            (click)="cleared.emit()"
          >
            {{ 'filters.clearAll' | transloco }}
          </button>
        }
      </div>

      <div>
        <label for="filter-search" class="mb-2 block text-sm font-medium">
          {{ 'filters.search' | transloco }}
        </label>
        <div class="relative">
          <app-icon
            name="search"
            [size]="1.1"
            class="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="filter-search"
            type="search"
            class="field ps-9"
            [placeholder]="'filters.searchPlaceholder' | transloco"
            [value]="query().search ?? ''"
            (input)="onSearch($event)"
          />
        </div>
      </div>

      <section>
        <h3 class="mb-2 text-sm font-medium">{{ 'filters.category' | transloco }}</h3>
        <ul class="space-y-1">
          <li>
            <button
              type="button"
              [class]="optionClass(query().categoryId === undefined)"
              (click)="patch.emit({ categoryId: undefined })"
            >
              {{ 'filters.all' | transloco }}
            </button>
          </li>
          @for (root of tree(); track root.id) {
            <li>
              <button
                type="button"
                [class]="optionClass(query().categoryId === root.id)"
                (click)="patch.emit({ categoryId: root.id })"
              >
                <span>{{ root.name }}</span>
                <span class="text-xs text-muted">{{ root.productCount }}</span>
              </button>
              @if (root.children.length) {
                <ul class="ms-3 mt-1 space-y-1 border-s border-border ps-2">
                  @for (child of root.children; track child.id) {
                    <li>
                      <button
                        type="button"
                        [class]="optionClass(query().categoryId === child.id)"
                        (click)="patch.emit({ categoryId: child.id })"
                      >
                        <span>{{ child.name }}</span>
                        <span class="text-xs text-muted">{{ child.productCount }}</span>
                      </button>
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ul>
      </section>

      <section>
        <h3 class="mb-2 text-sm font-medium">{{ 'filters.brand' | transloco }}</h3>
        <ul class="space-y-1">
          <li>
            <button
              type="button"
              [class]="optionClass(query().brandId === undefined)"
              (click)="patch.emit({ brandId: undefined })"
            >
              {{ 'filters.all' | transloco }}
            </button>
          </li>
          @for (brand of brands(); track brand.id) {
            <li>
              <button
                type="button"
                [class]="optionClass(query().brandId === brand.id)"
                (click)="patch.emit({ brandId: brand.id })"
              >
                <span>{{ brand.name }}</span>
                <span class="text-xs text-muted">{{ brand.productCount }}</span>
              </button>
            </li>
          }
        </ul>
      </section>

      <form (submit)="applyPrice($event, min.value, max.value)">
        <h3 class="mb-2 text-sm font-medium">{{ 'filters.price' | transloco }}</h3>
        <div class="flex items-center gap-2">
          <input
            #min
            type="number"
            min="0"
            inputmode="numeric"
            class="field"
            [placeholder]="'filters.min' | transloco"
            [attr.aria-label]="'filters.min' | transloco"
            [value]="query().minPrice ?? ''"
          />
          <span class="text-muted" aria-hidden="true">–</span>
          <input
            #max
            type="number"
            min="0"
            inputmode="numeric"
            class="field"
            [placeholder]="'filters.max' | transloco"
            [attr.aria-label]="'filters.max' | transloco"
            [value]="query().maxPrice ?? ''"
          />
        </div>
        <button type="submit" class="btn mt-2 w-full">{{ 'filters.apply' | transloco }}</button>
      </form>
    </div>
  `,
})
export class ProductFilters {
  readonly query = input.required<ProductQuery>();
  readonly categories = input<Category[]>([]);
  readonly brands = input<Brand[]>([]);

  /** التغيير المطلوب في الفلاتر (القيمة undefined معناها "شيل الفلتر"). */
  readonly patch = output<Partial<ProductQuery>>();
  readonly cleared = output<void>();

  protected readonly hasFilters = computed(() => hasActiveFilters(this.query()));

  /** التصنيفات الرئيسية وتحت كل واحد فروعه. */
  protected readonly tree = computed(() => {
    const all = this.categories();
    return all
      .filter((category) => category.parentId === null)
      .map((root) => ({
        ...root,
        children: all.filter((category) => category.parentId === root.id),
      }));
  });

  private readonly search$ = new Subject<string>();

  constructor() {
    // مش بنبعت request مع كل حرف: بنستنى 350ms بعد آخر كتابة
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => this.patch.emit({ search: value.trim() || undefined }));
  }

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  protected applyPrice(event: Event, min: string, max: string): void {
    event.preventDefault();
    let minPrice = parsePrice(min);
    let maxPrice = parsePrice(max);
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }
    this.patch.emit({ minPrice, maxPrice });
  }

  protected optionClass(active: boolean): string {
    return `${optionBase} ${
      active ? 'bg-accent/15 font-medium text-accent' : 'text-muted hover:bg-surface hover:text-fg'
    }`;
  }
}

function parsePrice(raw: string): number | undefined {
  const value = Number(raw);
  return raw.trim() !== '' && Number.isFinite(value) && value >= 0 ? value : undefined;
}
