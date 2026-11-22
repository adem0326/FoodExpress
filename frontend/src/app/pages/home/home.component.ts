// Charge les outils Angular necessaires au composant.
import { Component, OnInit, inject, signal } from '@angular/core';
// Charge les liens router utilises dans le template.
import { RouterLink } from '@angular/router';
// Charge le service restaurant.
import { RestaurantsService } from '../../services/restaurants.service';
// Charge le modele restaurant.
import { Restaurant } from '../../models/restaurant.models';
// Charge le service d'authentification pour adapter les actions a la session.
import { AuthService } from '../../services/auth.service';
// Charge la structure commune FoodExpress.
import { AppShellComponent } from '../../shared/app-shell.component';
// Declare le composant de page d'accueil.
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  // Injecte le service d'authentification.
  readonly auth = inject(AuthService);
  // Injecte le service restaurant.
  private readonly restaurantsService = inject(RestaurantsService);
  // Stocke les restaurants mis en avant.
  readonly restaurants = signal<Restaurant[]>([]);
  // Stocke un message d'erreur eventuel.
  readonly errorMessage = signal('');

  // Charge les donnees des qu'Angular initialise la page.
  ngOnInit(): void {
    // Appelle l'API des restaurants mis en avant.
    this.restaurantsService.featured().subscribe({
      // Enregistre les restaurants retournes.
      next: ({ restaurants }) => this.restaurants.set(restaurants),
      // Affiche une erreur si l'appel echoue.
      error: () => this.errorMessage.set('Impossible de charger les restaurants mis en avant')
    });
  }
}
