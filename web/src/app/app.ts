import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from './core/auth/auth.service';
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
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <a routerLink="/" class="inline-flex items-center gap-2 text-xl font-bold" dir="ltr">
            <app-icon name="bolt" [size]="1.4" class="text-accent" />
            <span>Volt<span class="text-accent">Cart</span></span>
          </a>
          <p class="mt-3 max-w-xs text-sm text-muted">{{ 'footer.tagline' | transloco }}</p>
        </div>

        <nav [attr.aria-label]="'footer.shop' | transloco">
          <h2 class="mb-3 text-sm font-semibold">{{ 'footer.shop' | transloco }}</h2>
          <ul class="space-y-2 text-sm text-muted">
            <li>
              <a routerLink="/" class="transition hover:text-fg">
                {{ 'nav.products' | transloco }}
              </a>
            </li>
          </ul>
        </nav>

        <nav [attr.aria-label]="'footer.account' | transloco">
          <h2 class="mb-3 text-sm font-semibold">{{ 'footer.account' | transloco }}</h2>
          <ul class="space-y-2 text-sm text-muted">
            @if (auth.isAuthenticated()) {
              <li>
                <a routerLink="/account" class="transition hover:text-fg">
                  {{ 'account.title' | transloco }}
                </a>
              </li>
            } @else {
              <li>
                <a routerLink="/login" class="transition hover:text-fg">
                  {{ 'auth.login.cta' | transloco }}
                </a>
              </li>
              <li>
                <a routerLink="/register" class="transition hover:text-fg">
                  {{ 'auth.register.cta' | transloco }}
                </a>
              </li>
            }
          </ul>
        </nav>
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
}
