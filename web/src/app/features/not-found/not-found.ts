import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto grid max-w-lg place-items-center gap-4 px-4 py-24 text-center">
      <app-icon name="bolt" [size]="3" class="text-accent" />
      <h1 class="text-3xl font-bold">{{ 'notFound.title' | transloco }}</h1>
      <p class="text-muted">{{ 'notFound.text' | transloco }}</p>
      <a routerLink="/" class="btn btn-accent">{{ 'notFound.home' | transloco }}</a>
    </div>
  `,
})
export class NotFound {}
