// Charge les outils Angular necessaires.
import { Component, OnInit, inject, signal } from '@angular/core';
// Charge les formulaires reactifs.
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// Charge les liens router.
import { RouterLink } from '@angular/router';
// Charge le service restaurant.
import { RestaurantsService } from '../../services/restaurants.service';
// Charge le service d'authentification.
import { AuthService } from '../../services/auth.service';
// Charge les types restaurant.
import { Restaurant } from '../../models/restaurant.models';
// Charge le shell commun.
import { AppShellComponent } from '../../shared/app-shell.component';

// Declare le composant de gestion des restaurants.
@Component({
  selector: 'app-manage-restaurants',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppShellComponent],
  templateUrl: './manage-restaurants.component.html',
  styleUrl: './manage-restaurants.component.css'
})
export class ManageRestaurantsComponent implements OnInit {
  // Injecte le service restaurant.
  private readonly restaurantsService = inject(RestaurantsService);
  // Injecte le service authentification.
  readonly auth = inject(AuthService);
  // Stocke les restaurants visibles selon le role.
  readonly restaurants = signal<Restaurant[]>([]);
  // Stocke un message de succes.
  readonly successMessage = signal('');
  // Stocke une erreur lisible.
  readonly errorMessage = signal('');
  // Indique si une action est en cours.
  readonly isLoading = signal(false);
  // Stocke l'identifiant du restaurant en modification.
  readonly editingId = signal('');

  // Definit le formulaire complete de restaurant.
  readonly restaurantForm = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(1000)] }),
    adresse: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(300)] }),
    imageUrl: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    cuisineType: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    horaires: new FormControl('Horaires non renseignés', { nonNullable: true, validators: [Validators.maxLength(300)] }),
    isOpen: new FormControl(true, { nonNullable: true }),
    deliveryFee: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(1000)] }),
    isFeatured: new FormControl(false, { nonNullable: true })
  });

  // Charge les restaurants selon le role connecte.
  ngOnInit(): void {
    // Reinitialise les messages.
    this.successMessage.set('');
    this.errorMessage.set('');
    // Identifie le role courant.
    const role = this.auth.getCurrentUser()?.role;
    // Charge tous les restaurants pour un administrateur.
    if (role === 'admin') {
      this.loadAll();
      return;
    }
    // Charge uniquement les restaurants du restaurateur.
    if (role === 'restaurateur') {
      this.loadMine();
    }
  }

  // Charge tous les restaurants pour l'administration.
  loadAll(): void {
    // Affiche le chargement.
    this.isLoading.set(true);
    // Appelle la route administrateur.
    this.restaurantsService.allRestaurants().subscribe({
      // Enregistre les restaurants.
      next: ({ restaurants }) => {
        this.restaurants.set(restaurants);
        this.isLoading.set(false);
      },
      // Affiche une erreur.
      error: () => {
        this.errorMessage.set('Impossible de charger les restaurants');
        this.isLoading.set(false);
      }
    });
  }

  // Charge uniquement les restaurants du restaurateur.
  loadMine(): void {
    // Affiche le chargement.
    this.isLoading.set(true);
    // Appelle la route personnelle.
    this.restaurantsService.myRestaurants().subscribe({
      // Enregistre les restaurants personnels.
      next: ({ restaurants }) => {
        this.restaurants.set(restaurants);
        this.isLoading.set(false);
      },
      // Affiche une erreur.
      error: () => {
        this.errorMessage.set('Impossible de charger vos restaurants');
        this.isLoading.set(false);
      }
    });
  }

  // Charge un restaurant dans le formulaire pour modification.
  editRestaurant(restaurant: Restaurant): void {
    // Enregistre l'identifiant en modification.
    this.editingId.set(restaurant._id);
    // Remplit tous les controles du formulaire.
    this.restaurantForm.reset({
      nom: restaurant.nom,
      description: restaurant.description,
      adresse: restaurant.adresse,
      imageUrl: restaurant.imageUrl,
      cuisineType: restaurant.cuisineType,
      horaires: restaurant.horaires,
      isOpen: restaurant.isOpen,
      deliveryFee: restaurant.deliveryFee,
      isFeatured: restaurant.isFeatured
    });
  }

  // Annule une modification ou vide le formulaire.
  cancelEdit(): void {
    // Vide l'identifiant de modification.
    this.editingId.set('');
    // Remet les valeurs initiales.
    this.restaurantForm.reset({
      nom: '',
      description: '',
      adresse: '',
      imageUrl: '',
      cuisineType: '',
      horaires: 'Horaires non renseignés',
      isOpen: true,
      deliveryFee: 0,
      isFeatured: false
    });
  }

  // Cree ou modifie le restaurant selon le mode courant.
  submitRestaurant(): void {
    // Empêche l'envoi si le formulaire est invalide.
    if (this.restaurantForm.invalid) {
      this.restaurantForm.markAllAsTouched();
      return;
    }
    // Récupère les valeurs non nulles du formulaire.
    const request = this.restaurantForm.getRawValue();
    // Nettoie les anciens messages.
    this.successMessage.set('');
    this.errorMessage.set('');
    // Modifie un restaurant existant.
    if (this.editingId()) {
      this.restaurantsService.update(this.editingId(), request).subscribe({
        next: ({ message }) => {
          this.successMessage.set(message);
          this.cancelEdit();
          this.reload();
        },
        error: (error) => this.errorMessage.set(error.error?.message || 'Impossible de mettre à jour le restaurant')
      });
      return;
    }
    // Cree un nouveau restaurant.
    this.restaurantsService.create(request).subscribe({
      next: ({ message }) => {
        this.successMessage.set(message);
        this.cancelEdit();
        this.reload();
      },
      error: (error) => this.errorMessage.set(error.error?.message || 'Impossible de créer le restaurant')
    });
  }

  // Supprime un restaurant apres confirmation.
  deleteRestaurant(restaurant: Restaurant): void {
    // Demande une confirmation utilisateur.
    if (!window.confirm(`Supprimer définitivement ${restaurant.nom} ?`)) return;
    // Lance la suppression.
    this.restaurantsService.delete(restaurant._id).subscribe({
      // Affiche le succes et recharge.
      next: ({ message }) => {
        this.successMessage.set(message);
        this.reload();
      },
      // Affiche une erreur.
      error: (error) => this.errorMessage.set(error.error?.message || 'Impossible de supprimer le restaurant')
    });
  }

  // Change le statut administratif d'un restaurant.
  changeStatus(restaurant: Restaurant, status: 'approved' | 'suspended'): void {
    // Lance la modification du statut.
    this.restaurantsService.updateStatus(restaurant._id, status).subscribe({
      // Affiche le succes et recharge.
      next: ({ message }) => {
        this.successMessage.set(message);
        this.reload();
      },
      // Affiche une erreur.
      error: (error) => this.errorMessage.set(error.error?.message || 'Impossible de modifier le statut')
    });
  }

  // Recharge la liste selon le role courant.
  private reload(): void {
    // Recharge tous les restaurants en mode administrateur.
    if (this.auth.getCurrentUser()?.role === 'admin') {
      this.loadAll();
    } else {
      // Recharge les restaurants personnels.
      this.loadMine();
    }
  }
}
