import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/auth/auth.service';
import {
  ContactRequest,
  ContactService,
  contactErrorKey,
} from '../../core/contact/contact.service';
import { firstError } from '../../core/forms/form-errors';
import { LanguageService } from '../../core/i18n/language.service';
import { ApiError } from '../../core/models/api.models';
import { PHONE_PATTERN } from '../../core/orders/order.models';
import { SHOP_WHATSAPP, SITE_INFO } from '../../core/site';
import { Icon, IconName } from '../../shared/ui/icon';

const MESSAGE_MAX = 2000;
const TOPICS = ['product', 'order', 'complaint', 'other'] as const;
type Topic = (typeof TOPICS)[number];

/** المواضيع اللي بيتسأل فيها رقم الطلب (اختياري). */
const TOPICS_WITH_ORDER: readonly Topic[] = ['order', 'complaint'];

/** اتصل بنا: واتساب وبيانات التواصل، إجابات سريعة، ونموذج رسالة بيتحفظ في الـ API ويتبعت للمتجر. */
@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto grid max-w-7xl gap-6 px-4 pt-6">
      <header
        class="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-accent via-[#1d4ed8] to-[#1e3a8a] px-6 py-6 text-white shadow-lift sm:px-10 sm:py-8"
      >
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -end-20 -top-24 -z-10 size-72 rounded-full bg-white/10 blur-2xl"
        ></div>
        <p
          class="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide"
        >
          {{ 'contact.eyebrow' | transloco }}
        </p>
        <h1 class="mt-3 max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          {{ 'contact.title' | transloco }}
        </h1>
        <p class="mt-2 max-w-xl text-white/85">{{ 'contact.subtitle' | transloco }}</p>
      </header>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div class="grid gap-3">
          @if (whatsappUrl(); as url) {
            <a
              [href]="url"
              target="_blank"
              rel="noopener"
              class="card group flex items-center gap-3 border-[#25d366]/40 bg-[#25d366]/10 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#25d366] hover:shadow-lift"
            >
              <span
                class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#128c4a] text-white"
              >
                <app-icon name="chat" [size]="1.3" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold">
                  {{ 'contact.whatsapp.title' | transloco }}
                </span>
                <span class="block text-sm text-muted">
                  {{ 'contact.whatsapp.text' | transloco }}
                </span>
              </span>
            </a>
          }

          @for (item of info(); track item.key) {
            <div class="card flex items-start gap-3 p-4">
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
                  <p class="text-sm text-muted">{{ item.value }}</p>
                }
              </div>
            </div>
          }

          <section class="card p-4" aria-labelledby="quick-title">
            <h2 id="quick-title" class="mb-3 flex items-center gap-2 text-sm font-semibold">
              <app-icon name="help" [size]="1.1" class="text-accent" />
              {{ 'contact.quick.title' | transloco }}
            </h2>
            <dl class="grid gap-3 text-sm">
              @for (key of quickKeys; track key) {
                <div>
                  <dt class="font-medium">{{ 'contact.quick.' + key + '.q' | transloco }}</dt>
                  <dd class="text-muted">{{ 'contact.quick.' + key + '.a' | transloco }}</dd>
                </div>
              }
            </dl>
            <a
              routerLink="/orders"
              class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
            >
              {{ 'contact.quick.track' | transloco }}
            </a>
          </section>
        </div>

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

              <fieldset>
                <legend class="mb-2 text-sm font-medium">
                  {{ 'contact.form.topic' | transloco }}
                </legend>
                <div class="flex flex-wrap gap-2">
                  @for (topic of topics; track topic) {
                    <label
                      class="chip cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                      [class.chip-active]="form.controls.topic.value === topic"
                    >
                      <input
                        type="radio"
                        class="sr-only"
                        formControlName="topic"
                        name="topic"
                        [value]="topic"
                      />
                      {{ 'contact.topics.' + topic | transloco }}
                    </label>
                  }
                </div>
              </fieldset>

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

                @if (askOrderNumber()) {
                  <div>
                    <label for="ct-order" class="mb-1.5 block text-sm font-medium">
                      {{ 'contact.form.orderNumber' | transloco }}
                      <span class="font-normal text-muted"
                        >({{ 'contact.form.optional' | transloco }})</span
                      >
                    </label>
                    <input
                      id="ct-order"
                      formControlName="orderNumber"
                      inputmode="numeric"
                      dir="ltr"
                      class="field"
                      placeholder="1042"
                      [attr.aria-invalid]="orderError() ? 'true' : null"
                      [attr.aria-describedby]="orderError() ? 'ct-order-error' : null"
                    />
                    @if (orderError(); as key) {
                      <p id="ct-order-error" class="mt-1.5 text-sm text-danger">
                        {{ key | transloco }}
                      </p>
                    }
                  </div>
                }
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
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly site = inject(SITE_INFO);
  private readonly whatsapp = inject(SHOP_WHATSAPP);

  protected readonly messageMax = MESSAGE_MAX;
  protected readonly topics = TOPICS;
  protected readonly quickKeys = ['pay', 'delivery'];

  /** كروت بيانات التواصل: بتظهر بس اللي اتملا في site.ts. */
  protected readonly info = computed(() => {
    const lang = this.language.lang();
    const items: { key: string; icon: IconName; value: string; href?: string }[] = [];
    if (this.site.phone) {
      items.push({
        key: 'phone',
        icon: 'phone',
        value: this.site.phone,
        href: `tel:${this.site.phone.replace(/\s/g, '')}`,
      });
    }
    if (this.site.email) {
      items.push({
        key: 'email',
        icon: 'mail',
        value: this.site.email,
        href: `mailto:${this.site.email}`,
      });
    }
    if (this.site.address[lang]) {
      items.push({ key: 'address', icon: 'pin', value: this.site.address[lang] });
    }
    if (this.site.hours[lang]) {
      items.push({ key: 'hours', icon: 'clock', value: this.site.hours[lang] });
    }
    return items;
  });

  /** رابط واتساب المتجر مع رسالة افتتاحية، أو null لو الرقم مش متظبط. */
  protected readonly whatsappUrl = computed(() => {
    if (!this.whatsapp) return null;
    this.language.lang(); // الرسالة بلغة الصفحة
    const text = this.transloco.translate('contact.whatsapp.message');
    return `https://wa.me/${this.whatsapp}?text=${encodeURIComponent(text)}`;
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    topic: ['product' as Topic],
    name: [
      this.auth.user()?.fullName ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    email: [
      this.auth.user()?.email ?? '',
      [Validators.required, Validators.email, Validators.maxLength(254)],
    ],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    orderNumber: ['', [Validators.pattern(/^\d{1,8}$/)]],
    message: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(MESSAGE_MAX)],
    ],
    website: [''],
  });

  private readonly topic = toSignal(this.form.controls.topic.valueChanges, {
    initialValue: this.form.controls.topic.value,
  });
  /** رقم الطلب بيظهر بس لما الموضوع يخص طلب. */
  protected readonly askOrderNumber = computed(() => TOPICS_WITH_ORDER.includes(this.topic()));

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

  protected orderError(): string | null {
    const c = this.form.controls.orderNumber;
    return firstError(
      c,
      { pattern: 'contact.validation.orderNumberInvalid' },
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

    // رقم الطلب المخفي ما يمنعش الإرسال حتى لو فيه قيمة قديمة غلط
    if (!this.askOrderNumber()) this.form.controls.orderNumber.reset('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    if (this.submitting()) return;

    const value = this.form.getRawValue();
    const message = value.message.trim();
    const orderNumber = value.orderNumber.trim();
    const request: ContactRequest = {
      name: value.name,
      email: value.email,
      phone: value.phone.trim() || null,
      // مفيش خانة موضوع: العنوان بيتاخد من أول الرسالة
      subject: message.replace(/\s+/g, ' ').slice(0, 60),
      message,
      topic: value.topic,
      orderNumber: orderNumber ? Number(orderNumber) : null,
      website: value.website,
    };

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
    this.form.controls.message.reset('');
    this.form.controls.orderNumber.reset('');
    this.submitted.set(false);
    this.serverError.set(null);
    this.sent.set(false);
  }

  /** بعد ما رسايل الأخطاء تتعرض، نحط المؤشر على أول حقل غلط (مهم على الموبايل). */
  private focusFirstInvalid(): void {
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}
