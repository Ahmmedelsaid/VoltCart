import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartService } from '../cart/cart.service';
import { ApiError } from '../models/api.models';
import { Order, OrderSummary, PlaceOrderRequest } from './order.models';

/** مفتاح الترجمة المناسب لخطأ من الـ orders endpoints. */
export function orderErrorKey(error: ApiError): string {
  switch (error.status) {
    case 0:
      return 'errors.network';
    case 400:
      return 'checkout.errors.invalid';
    case 404:
      return 'orders.errors.notFound';
    case 409:
      return 'checkout.errors.stock';
    default:
      return 'errors.server';
  }
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly cart = inject(CartService);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  list(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(this.baseUrl);
  }

  get(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  /** السلة بتتفضّى في الـ API مع الطلب، فبنحدّث النسخة اللي في الصفحة. */
  place(request: PlaceOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, request).pipe(tap(() => this.cart.reload()));
  }

  cancel(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${id}/cancel`, null);
  }
}
