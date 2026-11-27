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
import { Dish, DISH_CATEGORIES, DishCategory } from '../../models/dish.models';
import { DishesService } from '../../services/dishes.service';
import { CartService } from '../../services/cart.service';
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
  private readonly dishesService = inject(DishesService);
  readonly cart = inject(CartService);
  // Stocke le restaurant charge.
  readonly restaurant = signal<Restaurant | null>(null);
  readonly dishes = signal<Dish[]>([]);
  readonly dishCategories = DISH_CATEGORIES;
  readonly activeDishCategory = signal<DishCategory | null>(null);
  readonly isMenuLoading = signal(false);
  readonly menuErrorMessage = signal('');
  readonly cartMessage = signal('');
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
      next: ({ restaurant }) => {
        this.restaurant.set(restaurant);
        this.isMenuLoading.set(true);
        this.dishesService.listForRestaurant(restaurant._id).subscribe({
          next: ({ dishes }) => {
            this.dishes.set(dishes);
            this.isMenuLoading.set(false);
          },
          error: () => {
            this.menuErrorMessage.set('Impossible de charger le menu');
            this.isMenuLoading.set(false);
          }
        });
      },
      // Affiche une erreur lisible.
      error: () => this.errorMessage.set('Impossible de charger ce restaurant')
    });
  }

  dishesForCategory(category: string): Dish[] {
    return this.dishes().filter((dish) => dish.categorie === category);
  }

  visibleDishes(): Dish[] {
    const category = this.activeDishCategory();
    return category ? this.dishesForCategory(category) : this.dishes();
  }

  selectDishCategory(category: DishCategory | null): void {
    this.activeDishCategory.set(category);
  }

  addToCart(dish: Dish): void {
    const restaurant = this.restaurant();
    if (!restaurant) return;

    const result = this.cart.addItem(restaurant, dish);
    if (result === 'different-restaurant') {
      const currentRestaurant = this.cart.restaurant();
      if (!currentRestaurant || !window.confirm(
        `Votre panier contient déjà des articles de ${currentRestaurant.nom}. Le remplacer par des articles de ${restaurant.nom} ?`
      )) {
        return;
      }
      this.cart.replaceWith(restaurant, dish);
      this.cartMessage.set(`${dish.nom} a été ajouté au panier.`);
      return;
    }

    this.cartMessage.set(
      result === 'unavailable'
        ? 'Ce plat est actuellement indisponible.'
        : `${dish.nom} a été ajouté au panier.`
    );
  }
}
