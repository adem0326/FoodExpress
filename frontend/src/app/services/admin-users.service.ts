import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminUser,
  AdminUserPasswordRequest,
  AdminUserUpdateRequest,
  AdminUsersPage,
  AdminUsersQuery
} from '../models/admin-user.models';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  listUsers(query: AdminUsersQuery): Observable<AdminUsersPage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('role', query.role)
      .set('status', query.status);
    if (query.search.trim()) {
      params = params.set('search', query.search.trim());
    }
    return this.http.get<AdminUsersPage>(this.baseUrl, { params });
  }

  getUser(id: string): Observable<{ user: AdminUser }> {
    return this.http.get<{ user: AdminUser }>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  updateUser(id: string, updates: AdminUserUpdateRequest): Observable<{ message: string; user: AdminUser }> {
    return this.http.put<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/${encodeURIComponent(id)}`,
      updates
    );
  }

  updateStatus(id: string, isActive: boolean): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(
      `${this.baseUrl}/${encodeURIComponent(id)}/status`,
      { isActive }
    );
  }

  updatePassword(id: string, request: AdminUserPasswordRequest): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.baseUrl}/${encodeURIComponent(id)}/password`,
      request
    );
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }
}
