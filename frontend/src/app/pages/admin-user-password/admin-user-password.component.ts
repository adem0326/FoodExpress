import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminUser } from '../../models/admin-user.models';
import { AdminUsersService } from '../../services/admin-users.service';
import { FlashMessageService } from '../../services/flash-message.service';

const strongPassword: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.value;
  if (typeof password !== 'string' || !password) return null;
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)
    ? null
    : { strongPassword: true };
};

const passwordConfirmation: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('newPassword')?.value;
  const confirmation = control.get('confirmPassword')?.value;
  return confirmation && password !== confirmation ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-admin-user-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-user-password.component.html',
  styleUrl: '../admin-users/admin-users.component.css'
})
export class AdminUserPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminUsers = inject(AdminUsersService);
  private readonly destroyRef = inject(DestroyRef);
  readonly flashMessage = inject(FlashMessageService);

  readonly user = signal<AdminUser | null>(null);
  readonly userId = signal('');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), strongPassword]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordConfirmation });

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
      next: ({ user }) => this.user.set(user),
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
    this.adminUsers.updatePassword(this.userId(), this.form.getRawValue()).pipe(
      finalize(() => this.isSaving.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ message }) => {
        this.flashMessage.showSuccess(message);
        void this.router.navigate(['/admin/users']);
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(
        error.error?.message || 'Impossible de modifier le mot de passe utilisateur'
      )
    });
  }
}
