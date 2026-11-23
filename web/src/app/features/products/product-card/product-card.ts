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
      class="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-accent/60"
    >
      <div
        class="relative grid aspect-[16/10] place-items-center overflow-hidden sm:aspect-[4/3]"
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

      <div class="flex flex-1 flex-col gap-1 p-4">
        <span class="text-xs text-muted"
          >{{ product().brandName }} · {{ product().categoryName }}</span
        >
        <h3 class="line-clamp-2 font-semibold leading-snug">{{ product().name }}</h3>
        <p class="mt-auto pt-3 text-lg font-bold">{{ product().price | price }}</p>
      </div>
    </a>
  `,
})
export class ProductCard {
  readonly product = input.required<ProductListItem>();
}
