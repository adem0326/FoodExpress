import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminUserUpdateRequest } from '../../models/admin-user.models';
import { UserRole } from '../../models/auth.models';
import { AdminUsersService } from '../../services/admin-users.service';
import { AuthService } from '../../services/auth.service';
import { FlashMessageService } from '../../services/flash-message.service';

const telephoneValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value : '';
  const digitCount = value.replace(/\D/g, '').length;
  return digitCount >= 7 && digitCount <= 15 ? null : { telephone: true };
};

@Component({
  selector: 'app-admin-user-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-user-edit.component.html',
  styleUrl: '../admin-users/admin-users.component.css'
})
export class AdminUserEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminUsers = inject(AdminUsersService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly flashMessage = inject(FlashMessageService);

  readonly roles: UserRole[] = ['client', 'restaurateur', 'admin'];
  readonly userId = signal('');
  readonly isSelf = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    nom: ['', [Validators.required, Validators.maxLength(100)]],
    prenom: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    telephone: ['', [
      Validators.required,
      Validators.pattern(/^\+?[0-9\s().-]+$/),
      telephoneValidator
    ]],
    role: ['client' as UserRole, Validators.required]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Identifiant utilisateur invalide');
      this.isLoading.set(false);
      return;
    }
    this.userId.set(id);

    this.adminUsers.getUser(id).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ user }) => {
        const currentUser = this.auth.getCurrentUser();
        this.isSelf.set(!!currentUser && (user.id === currentUser.id || user.id === currentUser._id));
        this.form.patchValue({
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
          role: user.role
        });
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(
        error.error?.message || 'Impossible de charger cet utilisateur'
      )
    });
  }

  save(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSaving.set(true);
    const updates: AdminUserUpdateRequest = this.form.getRawValue();
    this.adminUsers.updateUser(this.userId(), updates).pipe(
      finalize(() => this.isSaving.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ message }) => {
        this.flashMessage.showSuccess(message);
        void this.router.navigate(['/admin/users']);
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(
        error.error?.message || 'Impossible de mettre à jour cet utilisateur'
      )
    });
  }
}
