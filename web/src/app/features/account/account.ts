import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../core/auth/auth.service';
import { initialOf } from '../../core/forms/form-errors';
import { Icon } from '../../shared/ui/icon';

/** صفحة العميل: بياناته وطلباته. (مفيش dashboard للأدمن في الواجهة دي.) */
@Component({
  selector: 'app-account',
  imports: [RouterLink, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.user(); as user) {
      <section class="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <header class="flex items-center gap-4">
          <div
            class="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-2xl font-bold text-accent-fg"
            aria-hidden="true"
          >
            {{ initial() }}
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-2xl font-bold tracking-tight">
              {{ 'account.greeting' | transloco: { name: firstName() } }}
            </h1>
            <p class="truncate text-muted" dir="ltr">{{ user.email }}</p>
          </div>
        </header>

        <div class="grid gap-4 sm:grid-cols-2">
          <section class="rounded-2xl border border-border bg-surface/60 p-5">
            <h2 class="mb-3 font-semibold">{{ 'account.profile' | transloco }}</h2>
            <dl class="grid gap-3 text-sm">
              <div>
                <dt class="text-muted">{{ 'account.name' | transloco }}</dt>
                <dd class="mt-0.5 font-medium">{{ user.fullName }}</dd>
              </div>
              <div>
                <dt class="text-muted">{{ 'account.email' | transloco }}</dt>
                <dd class="mt-0.5 font-medium" dir="ltr">{{ user.email }}</dd>
              </div>
            </dl>
          </section>

          <section
            class="grid content-start gap-2 rounded-2xl border border-border bg-surface/60 p-5"
          >
            <h2 class="font-semibold">{{ 'account.orders' | transloco }}</h2>
            <div class="grid justify-items-center gap-2 py-4 text-center">
              <app-icon name="box" [size]="2.2" class="text-muted/50" />
              <p class="text-sm text-muted">{{ 'account.noOrders' | transloco }}</p>
              <a routerLink="/" class="btn btn-accent mt-1">
                {{ 'account.startShopping' | transloco }}
              </a>
            </div>
          </section>
        </div>
      </section>
    }
  `,
})
export class Account {
  protected readonly auth = inject(AuthService);

  protected readonly initial = computed(() => initialOf(this.auth.user()?.fullName));
  protected readonly firstName = computed(
    () => this.auth.user()?.fullName.trim().split(/\s+/)[0] ?? '',
  );
}
