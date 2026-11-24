import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'bolt'
  | 'globe'
  | 'search'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'filter'
  | 'x'
  | 'box'
  | 'user'
  | 'log-out'
  | 'eye'
  | 'eye-off'
  | 'cart'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'check'
  | 'pin'
  | 'locate'
  | 'phone'
  | 'laptop'
  | 'headphones'
  | 'plug'
  | 'truck'
  | 'shield'
  | 'headset'
  | 'cash'
  | 'menu'
  | 'mail'
  | 'clock'
  | 'camera'
  | 'gamepad'
  | 'tablet'
  | 'watch'
  | 'tv'
  | 'chat'
  | 'help';

/** أيقونات SVG بسيطة (stroke) بتاخد لون النص الحالي. الحجم بالـ rem. */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block shrink-0',
    '[style.width.rem]': 'size()',
    '[style.height.rem]': 'size()',
  },
  template: `
    <svg
      class="size-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('bolt') {
          <path d="M13 2 3 14h9l-1 8 10-12h-9z" fill="currentColor" />
        }
        @case ('globe') {
          <circle cx="12" cy="12" r="10" />
          <path
            d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
          />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        }
        @case ('chevron-left') {
          <path d="m15 18-6-6 6-6" />
        }
        @case ('chevron-right') {
          <path d="m9 18 6-6-6-6" />
        }
        @case ('chevron-down') {
          <path d="m6 9 6 6 6-6" />
        }
        @case ('filter') {
          <path d="M4 6h16M7 12h10M10 18h4" />
        }
        @case ('x') {
          <path d="M18 6 6 18M6 6l12 12" />
        }
        @case ('box') {
          <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
          <path d="m3 8 9 5 9-5M12 13v8" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        }
        @case ('log-out') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        }
        @case ('eye') {
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('eye-off') {
          <path
            d="M17.9 17.9A10.1 10.1 0 0 1 12 19c-6.4 0-10-7-10-7a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2M1 1l22 22"
          />
          <path d="M14.1 14.1a3 3 0 1 1-4.2-4.2" />
        }
        @case ('cart') {
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('minus') {
          <path d="M5 12h14" />
        }
        @case ('trash') {
          <path
            d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"
          />
        }
        @case ('check') {
          <path d="m5 12 5 5 9-10" />
        }
        @case ('phone') {
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M11 18h2" />
        }
        @case ('laptop') {
          <rect x="4" y="5" width="16" height="11" rx="1.5" />
          <path d="M2 20h20" />
        }
        @case ('headphones') {
          <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
          <rect x="2.5" y="14" width="4" height="6" rx="1.5" />
          <rect x="17.5" y="14" width="4" height="6" rx="1.5" />
        }
        @case ('plug') {
          <path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5" />
        }
        @case ('truck') {
          <path d="M2 6h11v10H2zM13 9h4l4 4v3h-8" />
          <circle cx="6.5" cy="18" r="1.8" />
          <circle cx="17.5" cy="18" r="1.8" />
        }
        @case ('shield') {
          <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6z" />
          <path d="m9 12 2 2 4-4" />
        }
        @case ('headset') {
          <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
          <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
          <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
          <path d="M19.5 19c0 1.7-1.6 3-4 3h-2" />
        }
        @case ('cash') {
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 12h.01M18 12h.01" />
        }
        @case ('menu') {
          <path d="M4 6h16M4 12h16M4 18h16" />
        }
        @case ('mail') {
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="m2 7 10 7 10-7" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        }
        @case ('camera') {
          <path
            d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
          />
          <circle cx="12" cy="13" r="3.5" />
        }
        @case ('gamepad') {
          <path
            d="M6 8h12a4 4 0 0 1 4 4v3a3 3 0 0 1-5.2 2L15 15H9l-1.8 2A3 3 0 0 1 2 15v-3a4 4 0 0 1 4-4z"
          />
          <path d="M8 11v3M6.5 12.5h3M15.5 11.5h.01M17.5 13.5h.01" />
        }
        @case ('tablet') {
          <rect x="5" y="2.5" width="14" height="19" rx="2" />
          <path d="M11 18.5h2" />
        }
        @case ('watch') {
          <rect x="7" y="6" width="10" height="12" rx="3" />
          <path d="m9 6 .8-3h4.4L15 6M9 18l.8 3h4.4l.8-3" />
        }
        @case ('tv') {
          <rect x="2.5" y="4" width="19" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        }
        @case ('chat') {
          <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20l1.2-5.4A8.5 8.5 0 1 1 21 11.5z" />
        }
        @case ('help') {
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 17.5h.01" />
        }
        @case ('pin') {
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        }
        @case ('locate') {
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(1.25);
}
