import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { FlashMessageService } from '../../services/flash-message.service';

function strongPassword(control: AbstractControl): ValidationErrors | null {
  const password = control.value;
  if (typeof password !== 'string' || !password) return null;
  return /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)
    ? null
    : { strongPassword: true };
}

function passwordRelations(control: AbstractControl): ValidationErrors | null {
  const currentPassword = control.get('currentPassword')?.value;
  const newPassword = control.get('newPassword')?.value;
  const confirmation = control.get('confirmNewPassword')?.value;
  const errors: ValidationErrors = {};

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors['samePassword'] = true;
  }
  if (confirmation && newPassword !== confirmation) {
    errors['passwordMismatch'] = true;
  }
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private flashMessage = inject(FlashMessageService);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8), strongPassword]],
    confirmNewPassword: ['', [Validators.required]]
  }, { validators: passwordRelations });

  ngOnInit(): void {
    this.auth.getProfile().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de vérifier votre session');
      }
    });
  }

  submit(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.auth.changePassword({ currentPassword, newPassword }).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: ({ message }) => {
        this.flashMessage.showSuccess(message || 'Mot de passe modifié avec succès');
        this.form.reset();
        void this.router.navigate([this.auth.getHomeRoute()]);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de modifier le mot de passe');
      }
    });
  }
}
