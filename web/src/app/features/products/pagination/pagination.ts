import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../../shared/ui/icon';
import { pageWindow } from '../product-query';

@Component({
  selector: 'app-pagination',
  imports: [Icon, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <nav
        class="flex flex-wrap items-center justify-center gap-1.5"
        [attr.aria-label]="'pagination.label' | transloco"
      >
        <!-- الأسهم بتتعكس في RTL: "السابق" بيبقى على اليمين وبيشاور يمين -->
        <button
          type="button"
          class="btn !px-2.5"
          [disabled]="page() <= 1"
          [attr.aria-label]="'pagination.prev' | transloco"
          (click)="pageChange.emit(page() - 1)"
        >
          <app-icon name="chevron-left" class="rtl:rotate-180" />
        </button>

        @for (item of items(); track $index) {
          @if (item === 'gap') {
            <span class="px-1 text-muted" aria-hidden="true">…</span>
          } @else {
            <button
              type="button"
              class="btn min-w-10"
              [class.btn-accent]="item === page()"
              [attr.aria-current]="item === page() ? 'page' : null"
              [attr.aria-label]="'pagination.page' | transloco: { page: item }"
              (click)="pageChange.emit(item)"
            >
              {{ item }}
            </button>
          }
        }

        <button
          type="button"
          class="btn !px-2.5"
          [disabled]="page() >= totalPages()"
          [attr.aria-label]="'pagination.next' | transloco"
          (click)="pageChange.emit(page() + 1)"
        >
          <app-icon name="chevron-right" class="rtl:rotate-180" />
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly items = computed(() => pageWindow(this.page(), this.totalPages()));
}
