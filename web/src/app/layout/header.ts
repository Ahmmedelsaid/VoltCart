import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../core/i18n/language.service';
import { Icon } from '../shared/ui/icon';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
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

        <button
          type="button"
          class="btn ms-auto"
          [attr.lang]="language.lang() === 'ar' ? 'en' : 'ar'"
          (click)="language.toggle()"
        >
          <app-icon name="globe" [size]="1.1" />
          {{ 'lang.switchTo' | transloco }}
        </button>
      </div>
    </header>
  `,
})
export class Header {
  protected readonly language = inject(LanguageService);
}
