import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppShellComponent } from '../../shared/app-shell.component';
import { Dish, DishCategory, DISH_CATEGORIES } from '../../models/dish.models';
import { Restaurant } from '../../models/restaurant.models';
import { DishesService } from '../../services/dishes.service';

@Component({
  selector: 'app-manage-dishes',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppShellComponent],
  templateUrl: './manage-dishes.component.html',
  styleUrl: './manage-dishes.component.css'
})
export class ManageDishesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dishesService = inject(DishesService);
  readonly categories = DISH_CATEGORIES;
  readonly restaurantId = signal('');
  readonly restaurant = signal<Restaurant | null>(null);
  readonly dishes = signal<Dish[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingId = signal('');
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly dishForm = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)]
    }),
    imageUrl: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1000)]
    }),
    prix: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100000)]
    }),
    categorie: new FormControl<DishCategory>('Entrées', { nonNullable: true, validators: [Validators.required] }),
    disponible: new FormControl(true, { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Identifiant restaurant manquant');
      this.isLoading.set(false);
      return;
    }
    this.restaurantId.set(id);
    this.loadMenu();
  }

  editDish(dish: Dish): void {
    this.editingId.set(dish._id);
    this.dishForm.reset({
      nom: dish.nom,
      imageUrl: dish.imageUrl,
      description: dish.description,
      prix: dish.prix,
      categorie: dish.categorie,
      disponible: dish.disponible
    });
  }

  cancelEdit(): void {
    this.editingId.set('');
    this.dishForm.reset({
      nom: '',
      imageUrl: '',
      description: '',
      prix: 0,
      categorie: 'Entrées',
      disponible: true
    });
  }

  submitDish(): void {
    if (this.dishForm.invalid || this.isSaving()) {
      this.dishForm.markAllAsTouched();
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.isSaving.set(true);
    const request = this.dishForm.getRawValue();
    const request$ = this.editingId()
      ? this.dishesService.update(this.restaurantId(), this.editingId(), request)
      : this.dishesService.create(this.restaurantId(), request);

    request$.subscribe({
      next: ({ message }) => {
        this.successMessage.set(message);
        this.cancelEdit();
        this.isSaving.set(false);
        this.loadMenu();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible d’enregistrer le plat');
        this.isSaving.set(false);
      }
    });
  }

  deleteDish(dish: Dish): void {
    if (!window.confirm(`Supprimer définitivement ${dish.nom} du menu ?`)) return;
    this.successMessage.set('');
    this.errorMessage.set('');
    this.dishesService.delete(this.restaurantId(), dish._id).subscribe({
      next: ({ message }) => {
        this.successMessage.set(message);
        this.loadMenu();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de supprimer le plat');
      }
    });
  }

  private loadMenu(): void {
    this.isLoading.set(true);
    this.dishesService.listManaged(this.restaurantId()).subscribe({
      next: ({ restaurant, dishes }) => {
        this.restaurant.set(restaurant);
        this.dishes.set(dishes);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message || 'Impossible de charger le menu');
        this.isLoading.set(false);
      }
    });
  }
}
