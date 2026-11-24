import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateOrderPayload, Order, OrderStatus, RestaurantOrdersResponse } from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  create(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, payload);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/my-orders`);
  }

  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  getRestaurantOrders(statut: OrderStatus | '', page: number): Observable<RestaurantOrdersResponse> {
    let params = new HttpParams().set('page', String(page));
    if (statut) {
      params = params.set('statut', statut);
    }
    return this.http.get<RestaurantOrdersResponse>(`${this.baseUrl}/restaurant`, { params });
  }

  getRestaurantOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/restaurant/${id}`);
  }

  updateStatus(id: string, statut: OrderStatus): Observable<{ message: string; order: Order }> {
    return this.http.put<{ message: string; order: Order }>(`${this.baseUrl}/${id}/status`, { statut });
  }
}
