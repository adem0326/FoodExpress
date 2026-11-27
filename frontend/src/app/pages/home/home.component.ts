// Charge les outils Angular necessaires au composant.
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
export class HomeComponent implements OnInit, OnDestroy {
  // Injecte le service d'authentification.
  readonly auth = inject(AuthService);
  // Injecte le service restaurant.
  private readonly restaurantsService = inject(RestaurantsService);
  // Stocke les restaurants mis en avant.
  readonly restaurants = signal<Restaurant[]>([]);
  readonly mealSlides = [
    { src: '/meals/meal-salad.jpg', alt: 'Bol coloré de salade et légumes frais' },
    { src: '/meals/meal-pizza.jpg', alt: 'Pizza garnie de fromage et de légumes' },
    { src: '/meals/meal-grill.jpg', alt: 'Assortiment de grillades et légumes' },
    { src: '/meals/meal-burger.jpg', alt: 'Burger garni de fromage et de légumes' }
  ] as const;
  readonly activeMealSlide = signal(0);
  // Stocke un message d'erreur eventuel.
  readonly errorMessage = signal('');
  private slideTimer?: ReturnType<typeof setInterval>;

  // Charge les donnees des qu'Angular initialise la page.
  ngOnInit(): void {
    const motionPreference = typeof window === 'undefined'
      ? null
      : window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!motionPreference?.matches) {
      this.slideTimer = setInterval(() => {
        this.activeMealSlide.update((index) => (index + 1) % this.mealSlides.length);
      }, 2000);
    }

    // Charge les restaurants publics approuves, sans filtrer les mises en avant.
    this.restaurantsService.list({
      search: '',
      cuisine: '',
      availability: 'all',
      sort: 'featured',
      page: 1,
      limit: 100
    }).subscribe({
      // Enregistre les restaurants retournes.
      next: ({ restaurants }) => this.restaurants.set(restaurants),
      // Affiche une erreur si l'appel echoue.
      error: () => this.errorMessage.set('Impossible de charger les restaurants')
    });
  }

  ngOnDestroy(): void {
    if (this.slideTimer !== undefined) {
      clearInterval(this.slideTimer);
    }
  }
}
