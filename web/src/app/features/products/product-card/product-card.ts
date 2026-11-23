import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CartService } from '../../../core/cart/cart.service';
import { ProductListItem } from '../../../core/models/api.models';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { Icon } from '../../../shared/ui/icon';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, TranslocoPipe, PricePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative h-full">
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
            <span class="size-9 shrink-0" aria-hidden="true"></span>
          </div>
        </div>
      </a>
      <button
        type="button"
        class="absolute bottom-4 end-4 grid size-9 place-items-center rounded-full bg-surface-2 text-fg transition hover:bg-accent hover:text-accent-fg active:scale-95 disabled:opacity-50"
        [attr.aria-label]="'cart.add' | transloco"
        [disabled]="cart.addingProductId() === product().id"
        (click)="cart.addFromCatalog(product().id)"
      >
        <app-icon name="cart" [size]="1.1" />
      </button>
    </div>
  `,
})
export class ProductCard {
  readonly product = input.required<ProductListItem>();
  protected readonly cart = inject(CartService);
}
