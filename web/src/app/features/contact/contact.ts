import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../core/auth/auth.service';
import {
  ContactRequest,
  ContactService,
  contactErrorKey,
} from '../../core/contact/contact.service';
import { firstError } from '../../core/forms/form-errors';
import { ApiError } from '../../core/models/api.models';
import { PHONE_PATTERN } from '../../core/orders/order.models';
import { SITE } from '../../core/site';
import { Icon, IconName } from '../../shared/ui/icon';

const MESSAGE_MAX = 2000;

/** اتصل بنا: بيانات التواصل + نموذج رسالة بيتحفظ في الـ API. */
@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto grid max-w-7xl gap-8 px-4 pt-6">
      <header
        class="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-accent via-[#1d4ed8] to-[#1e3a8a] px-6 py-10 text-white shadow-lift sm:px-10 sm:py-14"
      >
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -end-20 -top-20 -z-10 size-80 rounded-full bg-white/10 blur-2xl"
        ></div>
        <p
          class="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide"
        >
          {{ 'contact.eyebrow' | transloco }}
        </p>
        <h1 class="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {{ 'contact.title' | transloco }}
        </h1>
        <p class="mt-3 max-w-xl text-white/85 sm:text-lg">{{ 'contact.subtitle' | transloco }}</p>
      </header>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <ul class="grid gap-3">
          @for (item of info; track item.key) {
            <li class="card flex items-start gap-3 p-4">
              <span
                class="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"
              >
                <app-icon [name]="item.icon" [size]="1.3" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold">{{ 'contact.info.' + item.key | transloco }}</p>
                @if (item.href) {
                  <a
                    [href]="item.href"
                    class="inline-block break-words text-sm text-muted transition hover:text-accent"
                    dir="ltr"
                  >
                    {{ item.value }}
                  </a>
                } @else {
                  <p class="text-sm text-muted">
                    {{ 'contact.info.' + item.key + 'Value' | transloco }}
                  </p>
                }
              </div>
            </li>
          }
        </ul>

        <section class="card p-5 sm:p-6" aria-labelledby="contact-form-title">
          @if (sent()) {
            <div class="grid place-items-center gap-3 px-2 py-10 text-center" role="status">
              <span class="grid size-14 place-items-center rounded-full bg-success/15 text-success">
                <app-icon name="check" [size]="1.8" />
              </span>
              <h2 class="text-xl font-bold">{{ 'contact.success.title' | transloco }}</h2>
              <p class="max-w-sm text-muted">{{ 'contact.success.text' | transloco }}</p>
              <button type="button" class="btn mt-2" (click)="again()">
                {{ 'contact.success.again' | transloco }}
              </button>
            </div>
          } @else {
            <h2 id="contact-form-title" class="mb-4 text-lg font-semibold">
              {{ 'contact.form.title' | transloco }}
            </h2>

            <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="grid gap-4">
              @if (serverError(); as key) {
                <p
                  role="alert"
                  class="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                >
                  {{ key | transloco }}
                </p>
              }

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="ct-name" class="mb-1.5 block text-sm font-medium">
                    {{ 'contact.form.name' | transloco }}
                  </label>
                  <input
                    id="ct-name"
                    formControlName="name"
                    autocomplete="name"
                    class="field"
                    [attr.aria-invalid]="nameError() ? 'true' : null"
                    [attr.aria-describedby]="nameError() ? 'ct-name-error' : null"
                  />
                  @if (nameError(); as key) {
                    <p id="ct-name-error" class="mt-1.5 text-sm text-danger">
                      {{ key | transloco }}
                    </p>
                  }
                </div>

                <div>
                  <label for="ct-email" class="mb-1.5 block text-sm font-medium">
                    {{ 'contact.form.email' | transloco }}
                  </label>
                  <input
                    id="ct-email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    inputmode="email"
                    dir="ltr"
                    class="field"
                    placeholder="name@example.com"
                    [attr.aria-invalid]="emailError() ? 'true' : null"
                    [attr.aria-describedby]="emailError() ? 'ct-email-error' : null"
                  />
                  @if (emailError(); as key) {
                    <p id="ct-email-error" class="mt-1.5 text-sm text-danger">
                      {{ key | transloco }}
                    </p>
                  }
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="ct-phone" class="mb-1.5 block text-sm font-medium">
                    {{ 'contact.form.phone' | transloco }}
                    <span class="font-normal text-muted"
                      >({{ 'contact.form.optional' | transloco }})</span
                    >
                  </label>
                  <input
                    id="ct-phone"
                    type="tel"
                    formControlName="phone"
                    autocomplete="tel"
                    inputmode="tel"
                    dir="ltr"
                    class="field"
                    placeholder="+20 100 123 4567"
                    [attr.aria-invalid]="phoneError() ? 'true' : null"
                    [attr.aria-describedby]="phoneError() ? 'ct-phone-error' : null"
                  />
                  @if (phoneError(); as key) {
                    <p id="ct-phone-error" class="mt-1.5 text-sm text-danger">
                      {{ key | transloco }}
                    </p>
                  }
                </div>

                <div>
                  <label for="ct-subject" class="mb-1.5 block text-sm font-medium">
                    {{ 'contact.form.subject' | transloco }}
                  </label>
                  <input
                    id="ct-subject"
                    formControlName="subject"
                    class="field"
                    [attr.aria-invalid]="subjectError() ? 'true' : null"
                    [attr.aria-describedby]="subjectError() ? 'ct-subject-error' : null"
                  />
                  @if (subjectError(); as key) {
                    <p id="ct-subject-error" class="mt-1.5 text-sm text-danger">
                      {{ key | transloco }}
                    </p>
                  }
                </div>
              </div>

              <div>
                <label for="ct-message" class="mb-1.5 block text-sm font-medium">
                  {{ 'contact.form.message' | transloco }}
                </label>
                <textarea
                  id="ct-message"
                  formControlName="message"
                  rows="6"
                  class="field resize-y"
                  [attr.maxlength]="messageMax"
                  [attr.aria-invalid]="messageError() ? 'true' : null"
                  [attr.aria-describedby]="messageError() ? 'ct-message-error' : null"
                ></textarea>
                <div class="mt-1.5 flex justify-between gap-3 text-sm">
                  @if (messageError(); as key) {
                    <p id="ct-message-error" class="text-danger">{{ key | transloco }}</p>
                  } @else {
                    <span></span>
                  }
                  <span class="text-xs text-muted" dir="ltr">
                    {{
                      'contact.form.counter'
                        | transloco: { count: form.controls.message.value.length, max: messageMax }
                    }}
                  </span>
                </div>
              </div>

              <!-- honeypot: الناس ما بتشوفهاش ولا بتملاها، البوتات آه -->
              <div class="absolute -start-[9999px]" aria-hidden="true">
                <label for="ct-website">Website</label>
                <input id="ct-website" formControlName="website" tabindex="-1" autocomplete="off" />
              </div>

              <button
                type="submit"
                class="btn btn-accent w-full py-3 text-base sm:w-auto sm:justify-self-start sm:px-8"
                [disabled]="submitting()"
              >
                {{ (submitting() ? 'contact.form.sending' : 'contact.form.send') | transloco }}
              </button>
            </form>
          }
        </section>
      </div>
    </div>
  `,
})
export class Contact {
  private readonly auth = inject(AuthService);
  private readonly contact = inject(ContactService);

  protected readonly messageMax = MESSAGE_MAX;
  protected readonly info: { key: string; icon: IconName; value?: string; href?: string }[] = [
    {
      key: 'phone',
      icon: 'phone',
      value: SITE.phone,
      href: `tel:${SITE.phone.replace(/\s/g, '')}`,
    },
    { key: 'email', icon: 'mail', value: SITE.email, href: `mailto:${SITE.email}` },
    { key: 'address', icon: 'pin' },
    { key: 'hours', icon: 'clock' },
  ];

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: [
      this.auth.user()?.fullName ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    email: [
      this.auth.user()?.email ?? '',
      [Validators.required, Validators.email, Validators.maxLength(254)],
    ],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    message: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(MESSAGE_MAX)],
    ],
    website: [''],
  });

  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly submitted = signal(false);

  protected nameError(): string | null {
    const c = this.form.controls.name;
    return firstError(
      c,
      { required: 'contact.validation.nameRequired', minlength: 'contact.validation.nameShort' },
      c.touched || this.submitted(),
    );
  }

  protected emailError(): string | null {
    const c = this.form.controls.email;
    return firstError(
      c,
      { required: 'contact.validation.emailRequired', email: 'contact.validation.emailInvalid' },
      c.touched || this.submitted(),
    );
  }

  protected phoneError(): string | null {
    const c = this.form.controls.phone;
    return firstError(
      c,
      { pattern: 'contact.validation.phoneInvalid' },
      c.touched || this.submitted(),
    );
  }

  protected subjectError(): string | null {
    const c = this.form.controls.subject;
    return firstError(
      c,
      {
        required: 'contact.validation.subjectRequired',
        minlength: 'contact.validation.subjectShort',
      },
      c.touched || this.submitted(),
    );
  }

  protected messageError(): string | null {
    const c = this.form.controls.message;
    return firstError(
      c,
      {
        required: 'contact.validation.messageRequired',
        minlength: 'contact.validation.messageShort',
      },
      c.touched || this.submitted(),
    );
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;

    const value = this.form.getRawValue();
    const request: ContactRequest = { ...value, phone: value.phone.trim() || null };

    this.submitting.set(true);
    this.serverError.set(null);
    this.contact.send(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
      },
      error: (error: ApiError) => {
        this.submitting.set(false);
        this.serverError.set(contactErrorKey(error));
      },
    });
  }

  protected again(): void {
    this.form.controls.subject.reset('');
    this.form.controls.message.reset('');
    this.submitted.set(false);
    this.serverError.set(null);
    this.sent.set(false);
  }
}
