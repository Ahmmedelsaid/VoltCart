import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { authErrorKey } from '../../../core/auth/auth-error';
import { safeReturnUrl } from '../../../core/auth/auth.guard';
import { AuthService } from '../../../core/auth/auth.service';
import { firstError } from '../../../core/forms/form-errors';
import { ApiError } from '../../../core/models/api.models';
import { Icon } from '../../../shared/ui/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto grid max-w-md gap-6 px-4 py-12">
      <header class="text-center">
        <app-icon name="bolt" [size]="2.25" class="text-accent" />
        <h1 class="mt-3 text-3xl font-bold tracking-tight">{{ 'auth.login.title' | transloco }}</h1>
        <p class="mt-1 text-muted">{{ 'auth.login.subtitle' | transloco }}</p>
      </header>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        novalidate
        class="grid gap-4 rounded-2xl border border-border bg-surface/60 p-6"
      >
        @if (serverError(); as key) {
          <p
            role="alert"
            class="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {{ key | transloco }}
          </p>
        }

        <div>
          <label for="login-email" class="mb-1.5 block text-sm font-medium">
            {{ 'auth.fields.email' | transloco }}
          </label>
          <input
            id="login-email"
            type="email"
            formControlName="email"
            autocomplete="email"
            inputmode="email"
            dir="ltr"
            class="field"
            placeholder="name@example.com"
            [attr.aria-invalid]="emailError() ? 'true' : null"
            [attr.aria-describedby]="emailError() ? 'login-email-error' : null"
          />
          @if (emailError(); as key) {
            <p id="login-email-error" class="mt-1.5 text-sm text-danger">{{ key | transloco }}</p>
          }
        </div>

        <div>
          <label for="login-password" class="mb-1.5 block text-sm font-medium">
            {{ 'auth.fields.password' | transloco }}
          </label>
          <div class="relative">
            <input
              id="login-password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              dir="ltr"
              class="field pe-11"
              [attr.aria-invalid]="passwordError() ? 'true' : null"
              [attr.aria-describedby]="passwordError() ? 'login-password-error' : null"
            />
            <button
              type="button"
              class="absolute inset-y-0 end-0 grid w-10 place-items-center text-muted transition hover:text-fg"
              [attr.aria-label]="
                (showPassword() ? 'auth.fields.hidePassword' : 'auth.fields.showPassword')
                  | transloco
              "
              [attr.aria-pressed]="showPassword()"
              (click)="showPassword.set(!showPassword())"
            >
              <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="1.1" />
            </button>
          </div>
          @if (passwordError(); as key) {
            <p id="login-password-error" class="mt-1.5 text-sm text-danger">
              {{ key | transloco }}
            </p>
          }
        </div>

        <button type="submit" class="btn btn-accent mt-1 w-full py-2.5" [disabled]="submitting()">
          {{ (submitting() ? 'auth.login.submitting' : 'auth.login.submit') | transloco }}
        </button>
      </form>

      <p class="text-center text-sm text-muted">
        {{ 'auth.login.noAccount' | transloco }}
        <a
          routerLink="/register"
          [queryParams]="returnUrlParam()"
          class="font-medium text-accent hover:underline"
        >
          {{ 'auth.login.createAccount' | transloco }}
        </a>
      </p>
    </section>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(100)]],
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  private readonly submitted = signal(false);

  private readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  protected returnUrlParam() {
    return this.returnUrl ? { returnUrl: this.returnUrl } : {};
  }

  protected emailError(): string | null {
    const control = this.form.controls.email;
    return firstError(
      control,
      { required: 'auth.validation.emailRequired', email: 'auth.validation.emailInvalid' },
      control.touched || this.submitted(),
    );
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;
    return firstError(
      control,
      { required: 'auth.validation.passwordRequired' },
      control.touched || this.submitted(),
    );
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl)),
      error: (error: ApiError) => {
        this.submitting.set(false);
        this.serverError.set(authErrorKey(error));
      },
    });
  }
}
