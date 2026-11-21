import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { User } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly user = signal<User | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.auth.getProfile().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ user }) => { this.user.set(user); },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de charger votre profil');
      }
    });
  }
}
