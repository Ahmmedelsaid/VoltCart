import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
            class="grid content-start justify-items-start gap-2 rounded-2xl border border-border bg-surface/60 p-5"
          >
            <h2 class="font-semibold">{{ 'account.orders' | transloco }}</h2>
            <app-icon name="box" [size]="1.6" class="text-muted/60" />
            <p class="text-sm text-muted">{{ 'account.noOrders' | transloco }}</p>
            <a routerLink="/" class="btn mt-1">{{ 'account.startShopping' | transloco }}</a>
          </section>
        </div>

        <div>
          <button type="button" class="btn" (click)="signOut()">
            <app-icon name="log-out" [size]="1.1" class="rtl:-scale-x-100" />
            {{ 'account.signOut' | transloco }}
          </button>
        </div>
      </section>
    }
  `,
})
export class Account {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly initial = computed(() => initialOf(this.auth.user()?.fullName));
  protected readonly firstName = computed(
    () => this.auth.user()?.fullName.trim().split(/\s+/)[0] ?? '',
  );

  protected signOut(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }
}
