import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiError } from '../models/api.models';

export interface ContactRequest {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  /** product | order | complaint | other */
  topic: string;
  /** رقم طلب ذكره العميل (اختياري). */
  orderNumber: number | null;
  /** خانة مخفية (honeypot): لازم تفضل فاضية. */
  website: string;
}

/** مفتاح الترجمة المناسب لخطأ من رسالة "اتصل بنا". */
export function contactErrorKey(error: ApiError): string {
  switch (error.status) {
    case 0:
      return 'errors.network';
    case 400:
      return 'contact.errors.invalid';
    case 429:
      return 'contact.errors.tooMany';
    default:
      return 'errors.server';
  }
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  send(request: ContactRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/contact`, request);
  }
}
