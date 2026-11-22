// Charge les outils Angular necessaires.
import { Component, OnInit, inject, signal } from '@angular/core';
// Charge les liens router.
import { ActivatedRoute, RouterLink } from '@angular/router';
// Charge DecimalPipe pour les montants.
import { DecimalPipe } from '@angular/common';
// Charge le service restaurants.
import { RestaurantsService } from '../../services/restaurants.service';
// Charge le type Restaurant.
import { Restaurant } from '../../models/restaurant.models';
// Charge la structure commune.
import { AppShellComponent } from '../../shared/app-shell.component';

// Declare le composant de details.
@Component({
  selector: 'app-restaurant-details',
  standalone: true,
  imports: [DecimalPipe, RouterLink, AppShellComponent],
  templateUrl: './restaurant-details.component.html',
  styleUrl: './restaurant-details.component.css'
})
export class RestaurantDetailsComponent implements OnInit {
  // Injecte la route active.
  private readonly route = inject(ActivatedRoute);
  // Injecte le service restaurant.
  private readonly restaurantsService = inject(RestaurantsService);
  // Stocke le restaurant charge.
  readonly restaurant = signal<Restaurant | null>(null);
  // Stocke une erreur eventuelle.
  readonly errorMessage = signal('');

  // Charge les details lorsque la page s'ouvre.
  ngOnInit(): void {
    // Lit l'identifiant fourni dans l'URL.
    const id = this.route.snapshot.paramMap.get('id');
    // Refuse une URL sans identifiant.
    if (!id) {
      this.errorMessage.set('Identifiant restaurant manquant');
      return;
    }
    // Charge le restaurant depuis l'API.
    this.restaurantsService.getById(id).subscribe({
      // Enregistre le restaurant charge.
      next: ({ restaurant }) => this.restaurant.set(restaurant),
      // Affiche une erreur lisible.
      error: () => this.errorMessage.set('Impossible de charger ce restaurant')
    });
  }
}
