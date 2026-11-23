import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Brand, Category } from '../models/api.models';

/** التصنيفات والبراندات بتتغيّر نادرًا، فبنجيبها مرة واحدة ونحتفظ بيها. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  readonly categories$ = this.http
    .get<Category[]>(`${environment.apiUrl}/categories`)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly brands$ = this.http
    .get<Brand[]>(`${environment.apiUrl}/brands`)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));
}
