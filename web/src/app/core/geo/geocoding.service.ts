import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReverseGeocode {
  address: string | null;
  state: string | null;
  /** كود ISO 3166-2 للمحافظة (مثلاً EG-KB): أدق من الاسم لأنه ثابت. */
  isoCode: string | null;
}

/** اقتراح عنوان من إحداثيات الدبوس (بيعدّي على الـ API مش على خدمة خارجية مباشرة). */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);

  reverse(lat: number, lng: number, lang: 'ar' | 'en'): Observable<ReverseGeocode> {
    const params = new HttpParams().set('lat', lat).set('lng', lng).set('lang', lang);
    return this.http.get<ReverseGeocode>(`${environment.apiUrl}/geocode/reverse`, { params });
  }
}
