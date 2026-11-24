import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
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
  host: { class: 'contents' },
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-ink text-xs text-white/80">
      <div class="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4">
        <p class="flex items-center gap-2">
          <app-icon name="truck" [size]="1" class="text-highlight" />
          {{ 'header.promo' | transloco }}
        </p>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded px-2 py-1 transition hover:bg-white/10 hover:text-white"
          [attr.lang]="language.lang() === 'ar' ? 'en' : 'ar'"
          (click)="language.toggle()"
        >
          <app-icon name="globe" [size]="1" />
          {{ 'lang.switchTo' | transloco }}
        </button>
      </div>
    </div>

    <div class="scroll-progress" aria-hidden="true"></div>

    <header
      class="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300"
      [class.shadow-md]="scrolled()"
      [class.shadow-none]="!scrolled()"
      style="view-transition-name: site-header"
    >
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 transition-[padding] duration-300"
        [class.py-3]="!scrolled()"
        [class.py-2]="scrolled()"
      >
        <a
          routerLink="/"
          class="group flex items-center gap-2 text-2xl font-bold tracking-tight"
          dir="ltr"
        >
          <span
            class="grid size-9 place-items-center rounded-xl bg-linear-to-br from-[#3b82f6] to-accent-hover text-accent-fg shadow-[0_8px_18px_-8px_rgb(37_99_235/0.8)] transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-110"
          >
            <app-icon name="bolt" [size]="1.3" />
          </span>
          <span>Volt<span class="text-accent">Cart</span></span>
        </a>

        <form
          role="search"
          class="relative order-last w-full md:order-none md:max-w-2xl md:flex-1"
          (submit)="search($event, q.value)"
        >
          <app-icon
            name="search"
            [size]="1.15"
            class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            #q
            type="search"
            name="q"
            class="field !rounded-full !bg-surface-2 !ps-11 !py-2.5 focus:!bg-surface focus:shadow-glow"
            [placeholder]="'filters.searchPlaceholder' | transloco"
            [attr.aria-label]="'header.searchLabel' | transloco"
          />
        </form>

        <div class="ms-auto flex items-center gap-2">
          <a
            routerLink="/cart"
            routerLinkActive="!border-accent !text-accent"
            class="btn relative !px-3 !py-2.5"
            [attr.aria-label]="'cart.title' | transloco"
          >
            <app-icon name="cart" [size]="1.3" />
            @if (cart.count() > 0) {
              <span
                class="absolute -end-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-highlight px-1 text-[11px] font-bold leading-5 text-ink"
                [class.animate-bump]="bump()"
              >
                {{ cart.count() }}
              </span>
            }
          </a>

          @if (auth.user(); as user) {
            <a
              routerLink="/account"
              routerLinkActive="!border-accent"
              class="btn !px-2 !py-2 sm:!px-3"
              [attr.aria-label]="'account.title' | transloco"
            >
              <span
                class="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg"
                aria-hidden="true"
              >
                {{ initial(user.fullName) }}
              </span>
              <span class="hidden max-w-32 truncate sm:inline">{{ user.fullName }}</span>
            </a>
            <button
              type="button"
              class="btn !px-2.5 !py-2.5"
              [attr.aria-label]="'auth.logout' | transloco"
              (click)="logout()"
            >
              <app-icon name="log-out" [size]="1.15" class="rtl:-scale-x-100" />
            </button>
          } @else {
            <a routerLink="/login" class="btn">{{ 'auth.login.cta' | transloco }}</a>
            <a routerLink="/register" class="btn btn-accent hidden sm:inline-flex">
              {{ 'auth.register.cta' | transloco }}
            </a>
          }
        </div>
      </div>

      <nav class="border-t border-border" [attr.aria-label]="'filters.category' | transloco">
        <ul
          class="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 text-sm font-medium"
        >
          <li>
            <a
              routerLink="/products"
              class="flex items-center gap-2 whitespace-nowrap rounded-lg bg-accent-soft px-3 py-1.5 text-accent transition hover:bg-accent hover:text-accent-fg"
            >
              <app-icon name="menu" [size]="1.1" />
              {{ 'header.allProducts' | transloco }}
            </a>
          </li>
          @for (category of categories(); track category.id) {
            <li>
              <a
                routerLink="/products"
                [queryParams]="{ categoryId: category.id }"
                class="nav-link block whitespace-nowrap rounded-lg px-3 py-1.5 text-fg/80 transition hover:text-accent"
              >
                {{ category.name }}
              </a>
            </li>
          }
          <li class="ms-auto hidden sm:block">
            <a
              routerLink="/products"
              [queryParams]="{ sort: 'newest' }"
              class="nav-link block whitespace-nowrap rounded-lg px-3 py-1.5 text-highlight-strong transition"
            >
              {{ 'home.newArrivals' | transloco }}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  `,
})
export class Header {
  protected readonly language = inject(LanguageService);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  protected readonly initial = initialOf;

  /** نزلنا شوية: الهيدر بيصغّر ويظهر ظل. */
  protected readonly scrolled = signal(false);
  /** عدّاد السلة بينبض لما يزيد. */
  protected readonly bump = signal(false);
  private previousCount: number | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const onScroll = () => this.scrolled.set(window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });

    effect(() => {
      const loaded = this.cart.cart() !== null;
      const count = this.cart.count();
      untracked(() => {
        // تحميل السلة بعد الدخول مش إضافة، فننبّض بس لما العدد يزيد والسلة محمّلة قبلها
        if (loaded && this.previousCount !== null && count > this.previousCount) {
          this.bump.set(true);
          setTimeout(() => this.bump.set(false), 500);
        }
        this.previousCount = loaded ? count : null;
      });
    });
  }

  private readonly allCategories = toSignal(
    inject(CatalogService).categories$.pipe(catchError(() => of<Category[]>([]))),
    { initialValue: [] as Category[] },
  );

  /** التصنيفات الفرعية (Phones, Laptops...) كلينكات في الـ header. */
  protected readonly categories = computed(() =>
    this.allCategories()
      .filter((category) => category.parentId !== null)
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 10),
  );

  protected search(event: Event, term: string): void {
    event.preventDefault();
    const search = term.trim();
    void this.router.navigate(['/products'], { queryParams: search ? { search } : {} });
  }

  protected logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }
}
