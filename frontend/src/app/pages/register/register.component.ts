import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RegisterRequest } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  readonly isRestaurantRegistration = this.route.snapshot.queryParamMap.get('role') === 'restaurateur';

  showPassword = false;
  showConfirmPassword = false;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8), this.strongPassword]],
    confirmPassword: ['', [Validators.required]],
    restaurantNom: ['', this.isRestaurantRegistration
      ? [Validators.required, Validators.minLength(2), Validators.maxLength(120)]
      : []],
    restaurantDescription: ['', this.isRestaurantRegistration
      ? [Validators.required, Validators.maxLength(1000)]
      : []],
    restaurantAdresse: ['', this.isRestaurantRegistration
      ? [Validators.required, Validators.maxLength(300)]
      : []],
    cuisineType: ['', this.isRestaurantRegistration
      ? [Validators.required, Validators.maxLength(80)]
      : []]
  }, { validators: this.passwordsMatch });

  submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);

    const values = this.form.getRawValue();
    const payload: RegisterRequest = {
      nom: values.nom.trim(),
      prenom: values.prenom.trim(),
      email: values.email.trim(),
      telephone: values.telephone.trim(),
      password: values.password,
      confirmPassword: values.confirmPassword,
      role: this.isRestaurantRegistration ? 'restaurateur' : 'client'
    };

    if (this.isRestaurantRegistration) {
      payload.restaurant = {
        nom: values.restaurantNom.trim(),
        description: values.restaurantDescription.trim(),
        adresse: values.restaurantAdresse.trim(),
        cuisineType: values.cuisineType.trim()
      };
    }

    this.auth.register(payload).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || (this.isRestaurantRegistration
          ? 'Compte restaurateur créé avec succès'
          : 'Compte créé avec succès'));
        this.form.reset();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de créer le compte');
      }
    });
  }

  private strongPassword(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string;
    if (!value) return null;
    const valid = /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
    return valid ? null : { strongPassword: true };
  }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMatch: true };
  }
}
