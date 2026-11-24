import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type * as Leaflet from 'leaflet';
import { EGYPT_CENTER, LatLng } from '../../core/geo/governorates';
import { Icon } from './icon';

type LeafletModule = typeof Leaflet;

/** دبوس أزرق بشكل الـ theme (SVG جوه divIcon بدل صور Leaflet الافتراضية اللي بتحتاج ملفات). */
const PIN_HTML = `
  <svg viewBox="0 0 36 44" width="36" height="44" aria-hidden="true" style="filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.45))">
    <path d="M18 43C18 43 3 28.5 3 16.5a15 15 0 0 1 30 0C33 28.5 18 43 18 43z" fill="#2563eb" stroke="#fff" stroke-width="2"/>
    <circle cx="18" cy="16.5" r="5.5" fill="#fff"/>
  </svg>`;

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

/**
 * خريطة (Leaflet + OpenStreetMap) بيختار عليها العميل مكان التوصيل بدبوس.
 * المكتبة بتتحمّل أول ما الخريطة تظهر (dynamic import) فمبتتقلش باقي الموقع.
 * الدبوس اختياري: الـ position فاضي = العميل ما اختارش.
 */
@Component({
  selector: 'app-location-picker',
  imports: [TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden rounded-xl border border-border bg-surface">
      <div class="relative isolate">
        <div
          #canvas
          dir="ltr"
          class="h-72 w-full bg-surface-2 sm:h-80"
          role="application"
          [attr.aria-label]="'checkout.map.label' | transloco"
        ></div>

        @if (!ready()) {
          <div
            class="absolute inset-0 z-[500] grid animate-pulse place-items-center bg-surface-2 text-sm text-muted"
          >
            {{ 'checkout.map.loading' | transloco }}
          </div>
        }

        <button
          type="button"
          class="btn btn-accent absolute end-3 top-3 z-[1000] shadow-lg"
          [disabled]="!ready() || locating()"
          (click)="locate()"
        >
          <app-icon name="locate" [size]="1.1" />
          {{ (locating() ? 'checkout.map.locating' : 'checkout.map.locate') | transloco }}
        </button>
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5">
        @if (locateError(); as key) {
          <p role="alert" class="text-xs text-danger">{{ key | transloco }}</p>
        } @else if (position()) {
          <p class="flex items-center gap-1.5 text-xs text-success">
            <app-icon name="check" [size]="0.95" />
            {{ 'checkout.map.pinned' | transloco }}
          </p>
        } @else {
          <p class="flex items-center gap-1.5 text-xs text-muted">
            <app-icon name="pin" [size]="0.95" />
            {{ 'checkout.map.hint' | transloco }}
          </p>
        }

        @if (position()) {
          <button
            type="button"
            class="shrink-0 text-xs font-medium text-muted underline hover:text-fg"
            (click)="clear()"
          >
            {{ 'checkout.map.clear' | transloco }}
          </button>
        }
      </div>
    </div>
  `,
})
export class LocationPicker {
  /** مكان الدبوس (two-way). null = مفيش دبوس. */
  readonly position = model<LatLng | null>(null);
  /** لما تتغيّر الخريطة بتروح للمكان ده (مثلاً مركز المحافظة المختارة). */
  readonly focus = input<LatLng | null>(null);
  /** بيتبعت لما العميل نفسه يختار مكان (ضغطة، سحب الدبوس، أو "موقعي"). */
  readonly picked = output<LatLng>();

  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');

  protected readonly ready = signal(false);
  protected readonly locating = signal(false);
  protected readonly locateError = signal<string | null>(null);

  private leaflet?: LeafletModule;
  private map?: Leaflet.Map;
  private marker?: Leaflet.Marker;
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.map?.remove();
    });

    afterNextRender(() => void this.init());

    effect(() => {
      const position = this.position();
      if (this.ready()) untracked(() => this.syncMarker(position));
    });

    effect(() => {
      const focus = this.focus();
      if (this.ready() && focus) {
        untracked(() => this.map?.flyTo([focus.lat, focus.lng], 11, { duration: 0.8 }));
      }
    });
  }

  protected clear(): void {
    this.position.set(null);
  }

  protected locate(): void {
    if (!('geolocation' in navigator)) {
      this.locateError.set('checkout.map.unavailable');
      return;
    }

    this.locating.set(true);
    this.locateError.set(null);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        this.locating.set(false);
        const point = { lat: result.coords.latitude, lng: result.coords.longitude };
        this.place(point);
        this.map?.flyTo([point.lat, point.lng], 16, { duration: 0.8 });
      },
      (error) => {
        this.locating.set(false);
        this.locateError.set(
          error.code === error.PERMISSION_DENIED
            ? 'checkout.map.denied'
            : 'checkout.map.unavailable',
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  private async init(): Promise<void> {
    const module = await import('leaflet');
    if (this.destroyed) return;

    // Leaflet بيتصدّر كـ CommonJS، فالـ API ممكن يبقى على .default حسب الـ bundler
    const L: LeafletModule = (module as unknown as { default?: LeafletModule }).default ?? module;
    this.leaflet = L;

    const start = this.position() ?? this.focus();
    const center = start ?? EGYPT_CENTER;
    const map = L.map(this.canvas().nativeElement, {
      center: [center.lat, center.lng],
      zoom: this.position() ? 16 : start ? 11 : 6,
    });
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
    map.on('click', (event: Leaflet.LeafletMouseEvent) =>
      this.place({ lat: event.latlng.lat, lng: event.latlng.lng }),
    );

    this.map = map;
    this.ready.set(true);
  }

  /** العميل اختار مكان: نحط الدبوس ونبلّغ اللي فوق (عشان يجيب اقتراح العنوان). */
  private place(point: LatLng): void {
    this.locateError.set(null);
    this.position.set(point);
    this.picked.emit(point);
  }

  private syncMarker(position: LatLng | null): void {
    const L = this.leaflet;
    const map = this.map;
    if (!L || !map) return;

    if (!position) {
      this.marker?.remove();
      this.marker = undefined;
      return;
    }

    const latlng: Leaflet.LatLngExpression = [position.lat, position.lng];
    if (this.marker) {
      this.marker.setLatLng(latlng);
      return;
    }

    const marker = L.marker(latlng, {
      draggable: true,
      icon: L.divIcon({
        className: 'pin-marker',
        html: PIN_HTML,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
      }),
    }).addTo(map);
    marker.on('dragend', () => {
      const moved = marker.getLatLng();
      this.place({ lat: moved.lat, lng: moved.lng });
    });
    this.marker = marker;
  }
}
