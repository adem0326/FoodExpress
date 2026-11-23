import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Dish, DishRequest } from '../models/dish.models';
import { Restaurant } from '../models/restaurant.models';

@Injectable({ providedIn: 'root' })
export class DishesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/restaurants`;

  listForRestaurant(restaurantId: string): Observable<{ dishes: Dish[] }> {
    return this.http.get<{ dishes: Dish[] }>(`${this.baseUrl}/${restaurantId}/dishes`);
  }

  listManaged(restaurantId: string): Observable<{ restaurant: Restaurant; dishes: Dish[] }> {
    return this.http.get<{ restaurant: Restaurant; dishes: Dish[] }>(
      `${this.baseUrl}/${restaurantId}/dishes/manage`
    );
  }

  create(restaurantId: string, request: DishRequest): Observable<{ message: string; dish: Dish }> {
    return this.http.post<{ message: string; dish: Dish }>(
      `${this.baseUrl}/${restaurantId}/dishes`,
      request
    );
  }

  update(restaurantId: string, dishId: string, request: DishRequest): Observable<{ message: string; dish: Dish }> {
    return this.http.put<{ message: string; dish: Dish }>(
      `${this.baseUrl}/${restaurantId}/dishes/${dishId}`,
      request
    );
  }

  delete(restaurantId: string, dishId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/${restaurantId}/dishes/${dishId}`
    );
  }
}
