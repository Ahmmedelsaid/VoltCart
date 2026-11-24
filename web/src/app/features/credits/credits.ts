import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';

interface PhotoCredit {
  product: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
}

/** حقوق الصور: بعض صور المنتجات من Wikimedia Commons بتراخيص بتطلب ذكر المصوّر. */
@Component({
  selector: 'app-credits',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl px-4 pt-6">
      <h1 class="text-3xl font-bold tracking-tight">{{ 'credits.title' | transloco }}</h1>
      <p class="mt-2 max-w-2xl text-muted">{{ 'credits.intro' | transloco }}</p>

      @let list = credits();
      @if (list === null) {
        <div class="card mt-6 h-64 animate-pulse" aria-hidden="true"></div>
      } @else if (list.length === 0) {
        <p class="card mt-6 p-6 text-muted">{{ 'credits.empty' | transloco }}</p>
      } @else {
        <ul class="card mt-6 divide-y divide-border">
          @for (credit of list; track credit.source) {
            <li class="grid gap-1 p-4 text-sm sm:grid-cols-[1fr_auto] sm:gap-4">
              <div class="min-w-0">
                <p class="font-semibold">{{ credit.product }}</p>
                <p class="text-muted">
                  <a
                    [href]="credit.source"
                    target="_blank"
                    rel="noopener"
                    class="underline transition hover:text-accent"
                    dir="ltr"
                  >
                    {{ credit.title }}
                  </a>
                  · {{ credit.author }}
                </p>
              </div>
              <p class="text-muted sm:text-end">
                @if (credit.licenseUrl) {
                  <a
                    [href]="credit.licenseUrl"
                    target="_blank"
                    rel="noopener"
                    class="underline transition hover:text-accent"
                  >
                    {{ credit.license }}
                  </a>
                } @else {
                  {{ credit.license }}
                }
              </p>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class Credits {
  /** null = لسه بيتحمّل. */
  protected readonly credits = toSignal(
    inject(HttpClient)
      .get<PhotoCredit[]>('/images/products/real/credits.json')
      .pipe(catchError(() => of<PhotoCredit[]>([]))),
    { initialValue: null },
  );
}
