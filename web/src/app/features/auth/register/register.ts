import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { authErrorKey } from '../../../core/auth/auth-error';
import { safeReturnUrl } from '../../../core/auth/auth.guard';
import { AuthService } from '../../../core/auth/auth.service';
import { firstError } from '../../../core/forms/form-errors';
import { ApiError } from '../../../core/models/api.models';
import { Icon } from '../../../shared/ui/icon';

/** نفس قاعدة الـ API: حرف واحد على الأقل ورقم واحد على الأقل. */
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto grid max-w-md gap-6 px-4 py-12">
      <header class="text-center">
        <app-icon name="bolt" [size]="2.25" class="text-accent" />
        <h1 class="mt-3 text-3xl font-bold tracking-tight">
          {{ 'auth.register.title' | transloco }}
        </h1>
        <p class="mt-1 text-muted">{{ 'auth.register.subtitle' | transloco }}</p>
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
          <label for="reg-name" class="mb-1.5 block text-sm font-medium">
            {{ 'auth.fields.fullName' | transloco }}
          </label>
          <input
            id="reg-name"
            type="text"
            formControlName="fullName"
            autocomplete="name"
            class="field"
            [attr.aria-invalid]="nameError() ? 'true' : null"
            [attr.aria-describedby]="nameError() ? 'reg-name-error' : null"
          />
          @if (nameError(); as key) {
            <p id="reg-name-error" class="mt-1.5 text-sm text-danger">{{ key | transloco }}</p>
          }
        </div>

        <div>
          <label for="reg-email" class="mb-1.5 block text-sm font-medium">
            {{ 'auth.fields.email' | transloco }}
          </label>
          <input
            id="reg-email"
            type="email"
            formControlName="email"
            autocomplete="email"
            inputmode="email"
            dir="ltr"
            class="field"
            placeholder="name@example.com"
            [attr.aria-invalid]="emailError() ? 'true' : null"
            [attr.aria-describedby]="emailError() ? 'reg-email-error' : null"
          />
          @if (emailError(); as key) {
            <p id="reg-email-error" class="mt-1.5 text-sm text-danger">{{ key | transloco }}</p>
          }
        </div>

        <div>
          <label for="reg-password" class="mb-1.5 block text-sm font-medium">
            {{ 'auth.fields.password' | transloco }}
          </label>
          <div class="relative">
            <input
              id="reg-password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="new-password"
              dir="ltr"
              class="field pe-11"
              [attr.aria-invalid]="passwordError() ? 'true' : null"
              aria-describedby="reg-password-hint"
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
            <p class="mt-1.5 text-sm text-danger">{{ key | transloco }}</p>
          }
          <p id="reg-password-hint" class="mt-1.5 text-xs text-muted">
            {{ 'auth.register.passwordHint' | transloco }}
          </p>
        </div>

        <div>
          <label for="reg-confirm" class="mb-1.5 block text-sm font-medium">
            {{ 'auth.fields.confirmPassword' | transloco }}
          </label>
          <input
            id="reg-confirm"
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="confirmPassword"
            autocomplete="new-password"
            dir="ltr"
            class="field"
            [attr.aria-invalid]="confirmError() ? 'true' : null"
            [attr.aria-describedby]="confirmError() ? 'reg-confirm-error' : null"
          />
          @if (confirmError(); as key) {
            <p id="reg-confirm-error" class="mt-1.5 text-sm text-danger">{{ key | transloco }}</p>
          }
        </div>

        <button type="submit" class="btn btn-accent mt-1 w-full py-2.5" [disabled]="submitting()">
          {{ (submitting() ? 'auth.register.submitting' : 'auth.register.submit') | transloco }}
        </button>
      </form>

      <p class="text-center text-sm text-muted">
        {{ 'auth.register.haveAccount' | transloco }}
        <a
          routerLink="/login"
          [queryParams]="returnUrlParam()"
          class="font-medium text-accent hover:underline"
        >
          {{ 'auth.register.signIn' | transloco }}
        </a>
      </p>
    </section>
  `,
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          Validators.pattern(PASSWORD_PATTERN),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  private readonly submitted = signal(false);

  private readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  protected returnUrlParam() {
    return this.returnUrl ? { returnUrl: this.returnUrl } : {};
  }

  protected nameError(): string | null {
    const control = this.form.controls.fullName;
    return firstError(
      control,
      { required: 'auth.validation.nameRequired', minlength: 'auth.validation.nameShort' },
      control.touched || this.submitted(),
    );
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
      {
        required: 'auth.validation.passwordRequired',
        minlength: 'auth.validation.passwordShort',
        pattern: 'auth.validation.passwordWeak',
      },
      control.touched || this.submitted(),
    );
  }

  protected confirmError(): string | null {
    const control = this.form.controls.confirmPassword;
    const show = control.touched || this.submitted();
    if (!show) return null;
    if (control.hasError('required')) return 'auth.validation.confirmRequired';
    return this.form.hasError('mismatch') ? 'auth.validation.mismatch' : null;
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    const { fullName, email, password } = this.form.getRawValue();
    this.auth.register({ fullName, email, password }).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl)),
      error: (error: ApiError) => {
        this.submitting.set(false);
        this.serverError.set(authErrorKey(error));
      },
    });
  }
}
