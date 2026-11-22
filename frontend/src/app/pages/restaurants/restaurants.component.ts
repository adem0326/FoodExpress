// Charge les outils Angular utilises par la page.
import { Component, OnInit, inject, signal } from '@angular/core';
// Charge le pipe DecimalPipe pour afficher les frais.
import { DecimalPipe } from '@angular/common';
// Charge les formulaires reactifs pour les filtres.
import { FormControl, ReactiveFormsModule } from '@angular/forms';
// Charge les liens router.
import { RouterLink } from '@angular/router';
// Charge le service restaurant.
import { RestaurantsService } from '../../services/restaurants.service';
// Charge les types utiles.
import { Restaurant, RestaurantAvailability, RestaurantPagination, RestaurantSort } from '../../models/restaurant.models';
// Charge la structure commune.
import { AppShellComponent } from '../../shared/app-shell.component';

// Declare le composant de liste des restaurants.
@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, AppShellComponent],
  templateUrl: './restaurants.component.html',
  styleUrl: './restaurants.component.css'
})
export class RestaurantsComponent implements OnInit {
  // Injecte le service HTTP.
  private readonly restaurantsService = inject(RestaurantsService);
  // Controle le champ de recherche.
  readonly search = new FormControl('', { nonNullable: true });
  // Stocke le filtre cuisine.
  readonly cuisine = signal('');
  // Stocke le filtre disponibilite.
  readonly availability = signal<RestaurantAvailability>('all');
  // Stocke le mode de tri.
  readonly sort = signal<RestaurantSort>('alphabetical');
  // Stocke les restaurants charges.
  readonly restaurants = signal<Restaurant[]>([]);
  // Stocke la pagination courante.
  readonly pagination = signal<RestaurantPagination>({ page: 1, limit: 12, total: 0, totalPages: 0 });
  // Indique si un chargement est en cours.
  readonly isLoading = signal(false);
  // Stocke une erreur visible.
  readonly errorMessage = signal('');

  // Charge les restaurants lors de l'ouverture de la page.
  ngOnInit(): void {
    // Lance la premiere requete.
    this.loadRestaurants();
  }

  // Met a jour le filtre cuisine a partir du select.
  setCuisine(event: Event): void {
    // Recupere la valeur selectionnee.
    const value = (event.target as HTMLSelectElement).value;
    // Enregistre la valeur cuisine.
    this.cuisine.set(value);
    // Retourne automatiquement a la premiere page.
    this.resetAndLoad();
  }

  // Met a jour le filtre disponibilite.
  setAvailability(event: Event): void {
    // Recupere la valeur selectionnee.
    const value = (event.target as HTMLSelectElement).value as RestaurantAvailability;
    // Verifie que la valeur est autorisee.
    if (['all', 'open', 'closed'].includes(value)) {
      // Enregistre le filtre.
      this.availability.set(value);
      // Recharge la premiere page.
      this.resetAndLoad();
    }
  }

  // Met a jour le tri alphabetique ou vedette.
  setSort(event: Event): void {
    // Recupere la valeur selectionnee.
    const value = (event.target as HTMLSelectElement).value as RestaurantSort;
    // Verifie que la valeur est autorisee.
    if (['alphabetical', 'featured'].includes(value)) {
      // Enregistre le tri.
      this.sort.set(value);
      // Recharge la premiere page.
      this.resetAndLoad();
    }
  }

  // Change la page affichee.
  changePage(page: number): void {
    // Ignore les numeros de page invalides.
    if (page < 1 || page > this.pagination().totalPages) return;
    // Met a jour le numero de page.
    this.pagination.update((pagination) => ({ ...pagination, page }));
    // Lance le chargement.
    this.loadRestaurants();
  }

  // Lance une nouvelle recherche apres appui sur le bouton.
  searchRestaurants(): void {
    // Retourne a la premiere page.
    this.resetAndLoad();
  }

  // Reinitialise la pagination puis charge les donnees.
  private resetAndLoad(): void {
    // Remplace la page courante par la page 1.
    this.pagination.update((pagination) => ({ ...pagination, page: 1 }));
    // Lance la lecture des restaurants.
    this.loadRestaurants();
  }

  // Charge les restaurants avec tous les filtres actuels.
  private loadRestaurants(): void {
    // Affiche l'etat de chargement.
    this.isLoading.set(true);
    // Efface une ancienne erreur.
    this.errorMessage.set('');
    // Appelle le service HTTP.
    this.restaurantsService.list({
      search: this.search.value,
      cuisine: this.cuisine(),
      availability: this.availability(),
      sort: this.sort(),
      page: this.pagination().page,
      limit: this.pagination().limit
    }).subscribe({
      // Enregistre la reponse et termine le chargement.
      next: ({ restaurants, pagination }) => {
        this.restaurants.set(restaurants);
        this.pagination.set(pagination);
        this.isLoading.set(false);
      },
      // Affiche une erreur lisible.
      error: () => {
        this.restaurants.set([]);
        this.errorMessage.set('Impossible de charger les restaurants');
        this.isLoading.set(false);
      }
    });
  }
}
