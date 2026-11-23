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

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Header, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="#main"
      class="sr-only rounded-lg bg-accent px-4 py-2 font-semibold text-accent-fg focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
    >
      {{ 'nav.skip' | transloco }}
    </a>
    <app-header />
    <main id="main" class="min-h-[70vh]">
      <router-outlet />
    </main>

    <footer class="mt-20 border-t border-border">
      <div class="mx-auto flex max-w-7xl flex-wrap justify-between gap-x-16 gap-y-10 px-4 py-12">
        <div class="max-w-xs">
          <a routerLink="/" class="inline-flex items-center gap-2 text-xl font-bold" dir="ltr">
            <app-icon name="bolt" [size]="1.4" class="text-accent" />
            <span>Volt<span class="text-accent">Cart</span></span>
          </a>
          <p class="mt-3 text-sm leading-relaxed text-muted/90">
            {{ 'footer.tagline' | transloco }}
          </p>
        </div>

        <div class="flex flex-wrap gap-x-16 gap-y-10">
          <nav [attr.aria-label]="'footer.shop' | transloco">
            <h2 class="mb-3 text-sm font-semibold">{{ 'footer.shop' | transloco }}</h2>
            <ul class="space-y-2 text-sm text-fg/70">
              <li>
                <a routerLink="/" class="transition hover:text-accent">
                  {{ 'footer.allProducts' | transloco }}
                </a>
              </li>
              @for (category of categories(); track category.id) {
                <li>
                  <a
                    routerLink="/"
                    [queryParams]="{ categoryId: category.id }"
                    class="transition hover:text-accent"
                  >
                    {{ category.name }}
                  </a>
                </li>
              }
            </ul>
          </nav>

          <nav [attr.aria-label]="'footer.account' | transloco">
            <h2 class="mb-3 text-sm font-semibold">{{ 'footer.account' | transloco }}</h2>
            <ul class="space-y-2 text-sm text-fg/70">
              @if (auth.isAuthenticated()) {
                <li>
                  <a routerLink="/account" class="transition hover:text-accent">
                    {{ 'account.title' | transloco }}
                  </a>
                </li>
              } @else {
                <li>
                  <a routerLink="/login" class="transition hover:text-accent">
                    {{ 'auth.login.cta' | transloco }}
                  </a>
                </li>
                <li>
                  <a routerLink="/register" class="transition hover:text-accent">
                    {{ 'auth.register.cta' | transloco }}
                  </a>
                </li>
              }
            </ul>
          </nav>
        </div>
      </div>

      <div class="border-t border-border py-4 text-center text-xs text-muted">
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
