import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../core/auth/auth.service';
import { initialOf } from '../core/forms/form-errors';
import { LanguageService } from '../core/i18n/language.service';
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

        <nav class="ms-4 hidden gap-5 text-sm text-muted sm:flex">
          <a
            routerLink="/"
            routerLinkActive="!text-fg"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition hover:text-fg"
          >
            {{ 'nav.products' | transloco }}
          </a>
        </nav>

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
  private readonly router = inject(Router);

  protected readonly initial = initialOf;

  protected logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }
}
