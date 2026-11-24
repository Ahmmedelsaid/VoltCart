import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, map, of } from 'rxjs';
import { GOVERNORATES } from '../../core/geo/governorates';
import { Category } from '../../core/models/api.models';
import { CatalogService } from '../../core/services/catalog.service';
import { ProductsService } from '../../core/services/products.service';
import { Icon, IconName } from '../../shared/ui/icon';

/** من نحن: القصة، أرقام حية من الكتالوج، القيم، خطوات الطلب. */
@Component({
  selector: 'app-about',
  imports: [RouterLink, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto grid max-w-7xl gap-12 px-4 pt-6">
      <header
        class="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-accent via-[#1d4ed8] to-[#1e3a8a] px-6 py-10 text-white shadow-lift sm:px-10 sm:py-14"
      >
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -end-20 -top-20 -z-10 size-80 rounded-full bg-white/10 blur-2xl"
        ></div>
        <app-icon
          name="bolt"
          [size]="14"
          class="pointer-events-none absolute -end-6 -top-6 -z-10 text-white opacity-[0.07]"
        />
        <p
          class="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide"
        >
          {{ 'about.eyebrow' | transloco }}
        </p>
        <h1 class="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          {{ 'about.title' | transloco }}
        </h1>
        <p class="mt-4 max-w-2xl text-white/85 sm:text-lg">{{ 'about.subtitle' | transloco }}</p>
      </header>

      <section class="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]" aria-labelledby="story">
        <div>
          <h2 id="story" class="section-title">{{ 'about.storyTitle' | transloco }}</h2>
          <p class="mt-4 leading-relaxed text-muted">{{ 'about.story1' | transloco }}</p>
          <p class="mt-3 leading-relaxed text-muted">{{ 'about.story2' | transloco }}</p>
        </div>

        <ul class="grid grid-cols-3 gap-3">
          @for (stat of stats(); track stat.key) {
            <li class="card grid place-items-center gap-1 px-2 py-6 text-center">
              <span class="text-3xl font-bold text-accent sm:text-4xl" dir="ltr">
                {{ stat.value }}
              </span>
              <span class="text-xs text-muted sm:text-sm">
                {{ 'about.stats.' + stat.key | transloco }}
              </span>
            </li>
          }
        </ul>
      </section>

      <section aria-labelledby="values">
        <h2 id="values" class="section-title mb-4">{{ 'about.valuesTitle' | transloco }}</h2>
        <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          @for (value of values; track value.key) {
            <li class="card grid content-start gap-3 p-5">
              <span class="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
                <app-icon [name]="value.icon" [size]="1.4" />
              </span>
              <h3 class="font-semibold">
                {{ 'about.values.' + value.key + '.title' | transloco }}
              </h3>
              <p class="text-sm leading-relaxed text-muted">
                {{ 'about.values.' + value.key + '.text' | transloco }}
              </p>
            </li>
          }
        </ul>
      </section>

      <section aria-labelledby="steps">
        <h2 id="steps" class="section-title mb-4">{{ 'about.stepsTitle' | transloco }}</h2>
        <ol class="grid gap-3 md:grid-cols-3">
          @for (step of steps; track step; let i = $index) {
            <li class="card flex gap-4 p-5">
              <span class="step">{{ i + 1 }}</span>
              <div>
                <h3 class="font-semibold">{{ 'about.steps.' + step + '.title' | transloco }}</h3>
                <p class="mt-1 text-sm leading-relaxed text-muted">
                  {{ 'about.steps.' + step + '.text' | transloco }}
                </p>
              </div>
            </li>
          }
        </ol>
      </section>

      <section
        class="card grid items-center gap-4 bg-accent-soft p-6 sm:grid-cols-[1fr_auto] sm:p-8"
        aria-labelledby="cta"
      >
        <div>
          <h2 id="cta" class="text-xl font-bold sm:text-2xl">{{ 'about.ctaTitle' | transloco }}</h2>
          <p class="mt-1 text-muted">{{ 'about.ctaText' | transloco }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a routerLink="/products" class="btn btn-accent px-5 py-3">
            {{ 'about.shop' | transloco }}
          </a>
          <a routerLink="/contact" class="btn px-5 py-3">{{ 'about.contact' | transloco }}</a>
        </div>
      </section>
    </div>
  `,
})
export class About {
  private readonly products = inject(ProductsService);
  private readonly catalog = inject(CatalogService);

  protected readonly values: { key: string; icon: IconName }[] = [
    { key: 'genuine', icon: 'shield' },
    { key: 'prices', icon: 'cash' },
    { key: 'delivery', icon: 'truck' },
    { key: 'support', icon: 'headset' },
  ];
  protected readonly steps = ['choose', 'order', 'receive'];

  private readonly productCount = toSignal(
    this.products.list({ pageSize: 1 }).pipe(
      map((result) => result.totalCount),
      catchError(() => of<number | null>(null)),
    ),
    { initialValue: null },
  );

  private readonly categoryCount = toSignal(
    this.catalog.categories$.pipe(
      map((categories: Category[]) => categories.filter((c) => c.parentId !== null).length),
      catchError(() => of<number | null>(null)),
    ),
    { initialValue: null },
  );

  /** أرقام حقيقية من الكتالوج؛ لو الـ API مش متاح بنعرض اللي معانا بس. */
  protected readonly stats = computed(() => {
    const items: { key: string; value: string }[] = [];
    const products = this.productCount();
    const categories = this.categoryCount();
    if (products !== null) items.push({ key: 'products', value: `${products}+` });
    if (categories !== null) items.push({ key: 'categories', value: `${categories}` });
    items.push({ key: 'governorates', value: `${GOVERNORATES.length}` });
    return items;
  });
}
