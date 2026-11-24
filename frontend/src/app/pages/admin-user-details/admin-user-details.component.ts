import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminUser } from '../../models/admin-user.models';
import { AdminUsersService } from '../../services/admin-users.service';

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-user-details.component.html',
  styleUrl: '../admin-users/admin-users.component.css'
})
export class AdminUserDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminUsers = inject(AdminUsersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = signal<AdminUser | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Identifiant utilisateur invalide');
      this.isLoading.set(false);
      return;
    }

    this.adminUsers.getUser(id).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ user }) => this.user.set(user),
      error: (error: HttpErrorResponse) => this.errorMessage.set(
        error.error?.message || 'Impossible de charger cet utilisateur'
      )
    });
  }
}
