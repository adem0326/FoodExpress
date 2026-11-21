import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, of, Subject, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AdminUsersService } from '../../services/admin-users.service';
import { FlashMessageService } from '../../services/flash-message.service';
import { AdminUser, AdminUserRoleFilter, AdminUserStatusFilter, AdminUsersPage, AdminUsersQuery } from '../../models/admin-user.models';
import { UserRole } from '../../models/auth.models';

type LoadUsersResult =
  | { success: true; response: AdminUsersPage }
  | { success: false; message: string };

const userRoles: UserRole[] = ['client', 'restaurateur', 'admin'];

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private readonly adminUsers = inject(AdminUsersService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadRequests = new Subject<AdminUsersQuery>();
  readonly flashMessage = inject(FlashMessageService);

  readonly search = new FormControl('', { nonNullable: true });
  readonly role = signal<AdminUserRoleFilter>('all');
  readonly status = signal<AdminUserStatusFilter>('all');
  readonly users = signal<AdminUser[]>([]);
  readonly pagination = signal({ page: 1, limit: 10, total: 0, totalPages: 0 });
  readonly isLoading = signal(false);
  readonly actionUserId = signal('');
  readonly errorMessage = signal('');
  readonly currentUser = this.auth.currentUser;

  ngOnInit(): void {
    this.loadRequests.pipe(
      switchMap((query) => {
        this.isLoading.set(true);
        this.errorMessage.set('');
        return this.adminUsers.listUsers(query).pipe(
          map((response): LoadUsersResult => ({ success: true, response })),
          catchError((error: HttpErrorResponse) => of({
            success: false as const,
            message: error.error?.message || 'Impossible de charger les utilisateurs'
          })),
          finalize(() => this.isLoading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((result) => {
      if (result.success) {
        this.users.set(result.response.users);
        this.pagination.set(result.response.pagination);
      } else {
        this.users.set([]);
        this.errorMessage.set(result.message);
      }
    });

    this.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.pagination.update((pagination) => ({ ...pagination, page: 1 }));
      this.loadUsers();
    });

    this.loadUsers();
  }

  setRole(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'all' || userRoles.includes(value as UserRole)) {
      this.role.set(value as AdminUserRoleFilter);
      this.resetPageAndLoad();
    }
  }

  setStatus(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'all' || value === 'active' || value === 'inactive') {
      this.status.set(value);
      this.resetPageAndLoad();
    }
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.pagination.update((pagination) => ({ ...pagination, page }));
    this.loadUsers();
  }

  toggleStatus(user: AdminUser): void {
    const isActive = !user.isActive;
    const verb = isActive ? 'activer' : 'désactiver';
    if (!window.confirm(`Voulez-vous vraiment ${verb} le compte de ${user.prenom} ${user.nom} ?`)) return;

    this.actionUserId.set(user.id);
    this.errorMessage.set('');
    this.adminUsers.updateStatus(user.id, isActive).pipe(
      finalize(() => this.actionUserId.set(''))
    ).subscribe({
      next: ({ message }) => {
        this.flashMessage.showSuccess(message);
        this.loadUsers();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de modifier le statut du compte');
      }
    });
  }

  deleteUser(user: AdminUser): void {
    if (!window.confirm(`Supprimer définitivement le compte de ${user.prenom} ${user.nom} ?`)) return;

    this.actionUserId.set(user.id);
    this.errorMessage.set('');
    this.adminUsers.deleteUser(user.id).pipe(
      finalize(() => this.actionUserId.set(''))
    ).subscribe({
      next: ({ message }) => {
        this.flashMessage.showSuccess(message);
        const page = this.pagination().page;
        this.pagination.update((pagination) => ({ ...pagination, page: Math.max(1, page - (this.users().length === 1 ? 1 : 0)) }));
        this.loadUsers();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de supprimer cet utilisateur');
      }
    });
  }

  isCurrentUser(user: AdminUser): boolean {
    const currentUser = this.currentUser();
    return !!currentUser && (user.id === currentUser.id || user.id === currentUser._id);
  }

  private resetPageAndLoad(): void {
    this.pagination.update((pagination) => ({ ...pagination, page: 1 }));
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loadRequests.next({
      search: this.search.value,
      role: this.role(),
      status: this.status(),
      page: this.pagination().page,
      limit: this.pagination().limit
    });
  }
}
