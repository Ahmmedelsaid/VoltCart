import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { Category } from './core/models/api.models';
import { CatalogService } from './core/services/catalog.service';
import { Header } from './layout/header';
import { Icon } from './shared/ui/icon';
import { Toasts } from './shared/ui/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Header, Toasts, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="#main"
      class="sr-only rounded-lg bg-accent px-4 py-2 font-semibold text-accent-fg focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
    >
      {{ 'nav.skip' | transloco }}
    </a>
    <app-header />
    <app-toasts />
    <main id="main" class="min-h-[70vh] pb-4">
      <router-outlet />
    </main>

    <footer class="mt-16 bg-ink text-white/70">
      <div
        class="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-10 px-4 py-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]"
      >
        <div class="col-span-2 max-w-xs lg:col-span-1">
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 text-xl font-bold text-white"
            dir="ltr"
          >
            <span class="grid size-9 place-items-center rounded-xl bg-accent text-accent-fg">
              <app-icon name="bolt" [size]="1.3" />
            </span>
            <span>Volt<span class="text-highlight">Cart</span></span>
          </a>
          <p class="mt-4 text-sm leading-relaxed">
            {{ 'footer.tagline' | transloco }}
          </p>
        </div>

        <div class="contents">
          <nav [attr.aria-label]="'footer.shop' | transloco">
            <h2 class="mb-4 text-sm font-semibold text-white">{{ 'footer.shop' | transloco }}</h2>
            <ul class="space-y-2.5 text-sm">
              <li>
                <a routerLink="/products" class="transition hover:text-white">
                  {{ 'footer.allProducts' | transloco }}
                </a>
              </li>
              <li>
                <a
                  routerLink="/products"
                  [queryParams]="{ sort: 'newest' }"
                  class="transition hover:text-white"
                >
                  {{ 'sort.newest' | transloco }}
                </a>
              </li>
              <li>
                <a
                  routerLink="/products"
                  [queryParams]="{ sort: 'price_asc' }"
                  class="transition hover:text-white"
                >
                  {{ 'sort.price_asc' | transloco }}
                </a>
              </li>
            </ul>
          </nav>

          <nav [attr.aria-label]="'footer.categories' | transloco">
            <h2 class="mb-4 text-sm font-semibold text-white">
              {{ 'footer.categories' | transloco }}
            </h2>
            <ul class="space-y-2.5 text-sm">
              @for (category of categories(); track category.id) {
                <li>
                  <a
                    routerLink="/products"
                    [queryParams]="{ categoryId: category.id }"
                    class="transition hover:text-white"
                  >
                    {{ category.name }}
                  </a>
                </li>
              }
            </ul>
          </nav>

          <nav [attr.aria-label]="'footer.account' | transloco">
            <h2 class="mb-4 text-sm font-semibold text-white">
              {{ 'footer.account' | transloco }}
            </h2>
            <ul class="space-y-2.5 text-sm">
              @if (auth.isAuthenticated()) {
                <li>
                  <a routerLink="/account" class="transition hover:text-white">
                    {{ 'account.title' | transloco }}
                  </a>
                </li>
                <li>
                  <a routerLink="/orders" class="transition hover:text-white">
                    {{ 'orders.title' | transloco }}
                  </a>
                </li>
              } @else {
                <li>
                  <a routerLink="/login" class="transition hover:text-white">
                    {{ 'auth.login.cta' | transloco }}
                  </a>
                </li>
                <li>
                  <a routerLink="/register" class="transition hover:text-white">
                    {{ 'auth.register.cta' | transloco }}
                  </a>
                </li>
              }
            </ul>
          </nav>
        </div>
      </div>

      <div class="border-t border-white/10 py-5 text-center text-xs text-white/60">
        {{ 'footer.rights' | transloco: { year: year } }}
      </div>
    </footer>
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly year = new Date().getFullYear();

  private readonly allCategories = toSignal(
    inject(CatalogService).categories$.pipe(catchError(() => of<Category[]>([]))),
    { initialValue: [] as Category[] },
  );

  /** أول 5 تصنيفات فرعية (Phones, Laptops...) كروابط في الفوتر. */
  protected readonly categories = computed(() =>
    this.allCategories()
      .filter((category) => category.parentId !== null)
      .slice(0, 5),
  );
}
