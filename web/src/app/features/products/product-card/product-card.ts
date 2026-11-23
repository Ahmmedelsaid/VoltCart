import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../../core/models/api.models';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { Icon } from '../../../shared/ui/icon';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, PricePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="['/products', product().id]"
      class="group flex h-full flex-col rounded-2xl border border-border bg-surface p-2 transition duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_18px_40px_-22px_rgb(255_214_10/0.45)]"
    >
      <div
        class="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-xl sm:aspect-[4/3]"
        [class.bg-photo]="product().imageUrl"
        [class.bg-linear-to-br]="!product().imageUrl"
        [class.from-surface-2]="!product().imageUrl"
        [class.to-bg]="!product().imageUrl"
      >
        @if (product().imageUrl) {
          <!-- multiply: الخلفية البيضاء للصورة بتذوب في لون اللوح -->
          <img
            [src]="product().imageUrl"
            [alt]="product().name"
            loading="lazy"
            decoding="async"
            class="absolute inset-0 size-full object-contain p-3 mix-blend-multiply brightness-[1.07] transition duration-300 group-hover:scale-105"
          />
        } @else {
          <app-icon
            name="box"
            [size]="3"
            class="text-muted/40 transition group-hover:text-accent/70"
          />
        }
      </div>

      <div class="flex flex-1 flex-col gap-1 px-2 pb-2 pt-3">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {{ product().brandName }}
        </span>
        <h3 class="line-clamp-2 font-semibold leading-snug">{{ product().name }}</h3>
        <span class="text-xs text-muted">{{ product().categoryName }}</span>

        <div class="mt-auto flex items-end justify-between gap-2 pt-3">
          <p class="text-lg font-bold">{{ product().price | price }}</p>
          <span
            class="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition group-hover:bg-accent group-hover:text-accent-fg"
            aria-hidden="true"
          >
            <app-icon name="chevron-right" [size]="1" class="rtl:rotate-180" />
          </span>
        </div>
      </div>
    </a>
  `,
})
export class ProductCard {
  readonly product = input.required<ProductListItem>();
}
