import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Header } from './layout/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, TranslocoPipe],
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
    <footer class="mt-16 border-t border-border py-8 text-center text-sm text-muted">
      {{ 'footer.rights' | transloco: { year: year } }}
    </footer>
  `,
})
export class App {
  protected readonly year = new Date().getFullYear();
}
