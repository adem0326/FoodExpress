import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  ProfileUpdateRequest,
  RegisterRequest,
  User
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private readonly tokenKey = 'foodexpress_token';
  private readonly userKey = 'foodexpress_user';
  readonly currentUser = signal<User | null>(this.restoreUser());

  register(request: RegisterRequest): Observable<{ message: string; user: User }> {
    return this.http.post<{ message: string; user: User }>(`${this.baseUrl}/auth/register`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, request).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.userKey, JSON.stringify(response.user));
        this.currentUser.set(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getProfile(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.baseUrl}/auth/me`).pipe(
      tap(({ user }) => this.setCurrentUser(user))
    );
  }

  updateProfile(request: ProfileUpdateRequest): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.baseUrl}/auth/profile`, request).pipe(
      tap(({ user }) => this.setCurrentUser(user))
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/auth/change-password`, request);
  }

  setCurrentUser(user: User): void {
    this.currentUser.set(user);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getHomeRoute(role = this.getCurrentUser()?.role): string {
    switch (role) {
      case 'client': return '/client';
      case 'restaurateur': return '/restaurateur';
      case 'admin': return '/admin';
      default: return '/login';
    }
  }

  private restoreUser(): User | null {
    const storedUser = localStorage.getItem(this.userKey);
    if (!storedUser || !this.getToken()) return null;
    try {
      return JSON.parse(storedUser) as User;
    } catch {
      this.logout();
      return null;
    }
  }
}
