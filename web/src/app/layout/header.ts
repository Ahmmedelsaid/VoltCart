import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { CartService } from '../core/cart/cart.service';
import { initialOf } from '../core/forms/form-errors';
import { LanguageService } from '../core/i18n/language.service';
import { Category } from '../core/models/api.models';
import { CatalogService } from '../core/services/catalog.service';
import { Icon } from '../shared/ui/icon';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <a
          routerLink="/"
          class="flex items-center gap-2 text-xl font-bold tracking-tight"
          dir="ltr"
        >
          <app-icon name="bolt" [size]="1.5" class="text-accent" />
          <span>Volt<span class="text-accent">Cart</span></span>
        </a>

        <nav
          class="ms-2 hidden items-center gap-5 text-sm text-muted lg:flex"
          [attr.aria-label]="'filters.category' | transloco"
        >
          @for (category of categories(); track category.id) {
            <a
              routerLink="/"
              [queryParams]="{ categoryId: category.id }"
              class="py-1 transition hover:text-fg"
            >
              {{ category.name }}
            </a>
          }
        </nav>

        <form
          role="search"
          class="relative ms-2 hidden max-w-sm flex-1 md:block"
          (submit)="search($event, q.value)"
        >
          <app-icon
            name="search"
            [size]="1.1"
            class="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            #q
            type="search"
            name="q"
            class="field !rounded-full !ps-10"
            [placeholder]="'filters.searchPlaceholder' | transloco"
            [attr.aria-label]="'filters.search' | transloco"
          />
        </form>

        <div class="ms-auto flex items-center gap-2">
          <button
            type="button"
            class="btn"
            [attr.lang]="language.lang() === 'ar' ? 'en' : 'ar'"
            (click)="language.toggle()"
          >
            <app-icon name="globe" [size]="1.1" />
            {{ 'lang.switchTo' | transloco }}
          </button>

          <a
            routerLink="/cart"
            routerLinkActive="!border-accent/60"
            class="btn relative !px-2.5"
            [attr.aria-label]="'cart.title' | transloco"
          >
            <app-icon name="cart" [size]="1.2" />
            @if (cart.count() > 0) {
              <span
                class="absolute -end-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-accent-fg"
              >
                {{ cart.count() }}
              </span>
            }
          </a>

          @if (auth.user(); as user) {
            <a
              routerLink="/account"
              routerLinkActive="!border-accent/60"
              class="btn !px-2 sm:!px-3"
              [attr.aria-label]="'account.title' | transloco"
            >
              <span
                class="grid size-6 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg"
                aria-hidden="true"
              >
                {{ initial(user.fullName) }}
              </span>
              <span class="hidden max-w-32 truncate sm:inline">{{ user.fullName }}</span>
            </a>
            <button
              type="button"
              class="btn !px-2.5"
              [attr.aria-label]="'auth.logout' | transloco"
              (click)="logout()"
            >
              <app-icon name="log-out" [size]="1.1" class="rtl:-scale-x-100" />
            </button>
          } @else {
            <a routerLink="/login" class="btn">{{ 'auth.login.cta' | transloco }}</a>
            <a routerLink="/register" class="btn btn-accent hidden sm:inline-flex">
              {{ 'auth.register.cta' | transloco }}
            </a>
          }
        </div>
      </div>
    </header>
  `,
})
export class Header {
  protected readonly language = inject(LanguageService);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  protected readonly initial = initialOf;

  private readonly allCategories = toSignal(
    inject(CatalogService).categories$.pipe(catchError(() => of<Category[]>([]))),
    { initialValue: [] as Category[] },
  );

  /** التصنيفات الفرعية (Phones, Laptops...) كلينكات في الـ header. */
  protected readonly categories = computed(() =>
    this.allCategories()
      .filter((category) => category.parentId !== null)
      .slice(0, 4),
  );

  protected search(event: Event, term: string): void {
    event.preventDefault();
    const search = term.trim();
    void this.router.navigate(['/'], { queryParams: search ? { search } : {} });
  }

  protected logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }
}
