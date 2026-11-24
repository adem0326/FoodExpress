import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { FlashMessageService } from '../../services/flash-message.service';
import { AppShellComponent } from '../../shared/app-shell.component';

function nonBlank(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
}

function validTelephone(control: AbstractControl): ValidationErrors | null {
  const telephone = control.value;
  if (typeof telephone !== 'string' || !/^\+?[0-9\s().-]+$/.test(telephone.trim())) {
    return { telephone: true };
  }
  const digits = telephone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? null : { telephone: true };
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppShellComponent],
  templateUrl: './edit-profile.component.html'
})
export class EditProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private flashMessage = inject(FlashMessageService);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    prenom: ['', [Validators.required, nonBlank]],
    nom: ['', [Validators.required, nonBlank]],
    telephone: ['', [Validators.required, validTelephone]]
  });

  ngOnInit(): void {
    this.auth.getProfile().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ user }) => {
        this.form.patchValue({
          prenom: user.prenom,
          nom: user.nom,
          telephone: user.telephone
        });
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de charger votre profil');
      }
    });
  }

  submit(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const values = this.form.getRawValue();
    this.auth.updateProfile({
      prenom: values.prenom.trim(),
      nom: values.nom.trim(),
      telephone: values.telephone.trim()
    }).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: ({ message }) => {
        this.flashMessage.showSuccess(message || 'Profil mis à jour avec succès');
        void this.router.navigate([this.auth.getHomeRoute()]);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de mettre à jour le profil');
      }
    });
  }
}
