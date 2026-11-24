// Charge HttpClient pour appeler les routes Express.
import { HttpClient, HttpParams } from '@angular/common/http';
// Rend ce service injectable dans toute l'application.
import { Injectable, inject } from '@angular/core';
// Charge RxJS pour typer les reponses HTTP.
import { Observable } from 'rxjs';
// Charge l'URL de base du backend.
import { environment } from '../../environments/environment';
// Charge les interfaces TypeScript des restaurants.
import {
  Restaurant,
  RestaurantCreateRequest,
  RestaurantPagination,
  RestaurantQuery,
  RestaurantUpdateRequest
} from '../models/restaurant.models';

// Declare le service comme singleton Angular.
@Injectable({ providedIn: 'root' })
export class RestaurantsService {
  // Injecte le client HTTP Angular.
  private readonly http = inject(HttpClient);
  // Definit l'URL de base des restaurants.
  private readonly baseUrl = `${environment.apiUrl}/restaurants`;

  // Liste les restaurants publics avec filtres et pagination.
  list(query: RestaurantQuery): Observable<{ restaurants: Restaurant[]; pagination: RestaurantPagination }> {
    // Initialise les parametres HTTP a envoyer.
    let params = new HttpParams()
      .set('search', query.search)
      .set('cuisine', query.cuisine)
      .set('availability', query.availability)
      .set('sort', query.sort)
      .set('page', String(query.page))
      .set('limit', String(query.limit));
    // Execute la requete GET publique.
    return this.http.get<{ restaurants: Restaurant[]; pagination: RestaurantPagination }>(this.baseUrl, { params });
  }

  // Charge les restaurants mis en avant.
  featured(): Observable<{ restaurants: Restaurant[] }> {
    // Execute la requete GET sur la route featured.
    return this.http.get<{ restaurants: Restaurant[] }>(`${this.baseUrl}/featured`);
  }

  // Charge les details publics d'un restaurant.
  getById(id: string): Observable<{ restaurant: Restaurant }> {
    // Execute la requete GET avec l'identifiant.
    return this.http.get<{ restaurant: Restaurant }>(`${this.baseUrl}/${id}`);
  }

  // Charge les restaurants personnels d'un restaurateur.
  myRestaurants(): Observable<{ restaurants: Restaurant[] }> {
    // Execute la requete GET sur la route protegee.
    return this.http.get<{ restaurants: Restaurant[] }>(`${this.baseUrl}/my`);
  }

  // Charge tous les restaurants pour l'administrateur.
  allRestaurants(): Observable<{ restaurants: Restaurant[] }> {
    // Execute la requete GET sur la route d'administration.
    return this.http.get<{ restaurants: Restaurant[] }>(`${this.baseUrl}/admin/all`);
  }

  // Cree un restaurant pour le role autorise.
  create(request: RestaurantCreateRequest): Observable<{ message: string; restaurant: Restaurant }> {
    // Execute la requete POST.
    return this.http.post<{ message: string; restaurant: Restaurant }>(this.baseUrl, request);
  }

  // Modifie un restaurant existant.
  update(id: string, request: RestaurantUpdateRequest): Observable<{ message: string; restaurant: Restaurant }> {
    // Execute la requete PUT avec l'identifiant.
    return this.http.put<{ message: string; restaurant: Restaurant }>(`${this.baseUrl}/${id}`, request);
  }

  // Supprime un restaurant existant.
  delete(id: string): Observable<{ message: string }> {
    // Execute la requete DELETE avec l'identifiant.
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  // Valide, suspend ou remet en attente un restaurant.
  updateStatus(id: string, status: 'approved' | 'suspended' | 'pending'): Observable<{ message: string; restaurant: Restaurant }> {
    // Execute la requete PATCH avec le nouveau statut.
    return this.http.patch<{ message: string; restaurant: Restaurant }>(`${this.baseUrl}/${id}/status`, { status });
  }
}
