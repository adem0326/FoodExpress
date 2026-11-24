import { Injectable, computed, signal } from '@angular/core';
import { CartItem, CartRestaurant } from '../models/order.models';

const STORAGE_KEY = 'foodexpress_cart';

interface CartState {
  restaurant: CartRestaurant | null;
  items: CartItem[];
}

// Types minimaux : compatibles avec les modeles Dish / Restaurant existants.
export interface CartableDish {
  _id: string;
  nom: string;
  prix: number;
  imageUrl?: string;
  disponible: boolean;
}

export interface CartableRestaurant {
  _id: string;
  nom: string;
  deliveryFee: number;
}

export type AddResult = 'added' | 'unavailable' | 'different-restaurant';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly state = signal<CartState>(this.load());

  readonly restaurant = computed(() => this.state().restaurant);
  readonly items = computed(() => this.state().items);
  readonly isEmpty = computed(() => this.state().items.length === 0);
  readonly count = computed(() => this.state().items.reduce((sum, item) => sum + item.quantite, 0));
  readonly subtotal = computed(() =>
    this.round(this.state().items.reduce((sum, item) => sum + item.prix * item.quantite, 0))
  );
  readonly deliveryFee = computed(() => (this.isEmpty() ? 0 : this.state().restaurant?.deliveryFee ?? 0));
  readonly total = computed(() => this.round(this.subtotal() + this.deliveryFee()));

  // Ajoute un plat. Si le panier contient deja un autre restaurant, rien n'est modifie :
  // le composant doit demander confirmation puis appeler replaceWith().
  addItem(restaurant: CartableRestaurant, dish: CartableDish, quantite = 1): AddResult {
    if (!dish.disponible) {
      return 'unavailable';
    }
    const current = this.state();
    if (current.restaurant && current.restaurant.id !== restaurant._id && current.items.length > 0) {
      return 'different-restaurant';
    }

    const cartRestaurant: CartRestaurant = {
      id: restaurant._id,
      nom: restaurant.nom,
      deliveryFee: restaurant.deliveryFee
    };
    const existing = current.items.find((item) => item.dishId === dish._id);
    const items = existing
      ? current.items.map((item) =>
          item.dishId === dish._id ? { ...item, quantite: item.quantite + quantite } : item
        )
      : [
          ...current.items,
          { dishId: dish._id, nom: dish.nom, prix: dish.prix, imageUrl: dish.imageUrl ?? '', quantite }
        ];

    this.update({ restaurant: cartRestaurant, items });
    return 'added';
  }

  // Vide le panier puis ajoute le plat (apres confirmation de l'utilisateur).
  replaceWith(restaurant: CartableRestaurant, dish: CartableDish, quantite = 1): AddResult {
    this.clear();
    return this.addItem(restaurant, dish, quantite);
  }

  increase(dishId: string): void {
    this.setQuantity(dishId, (this.find(dishId)?.quantite ?? 0) + 1);
  }

  decrease(dishId: string): void {
    this.setQuantity(dishId, (this.find(dishId)?.quantite ?? 0) - 1);
  }

  setQuantity(dishId: string, quantite: number): void {
    if (quantite < 1) {
      this.remove(dishId);
      return;
    }
    const current = this.state();
    this.update({
      ...current,
      items: current.items.map((item) => (item.dishId === dishId ? { ...item, quantite } : item))
    });
  }

  remove(dishId: string): void {
    const items = this.state().items.filter((item) => item.dishId !== dishId);
    this.update({ restaurant: items.length ? this.state().restaurant : null, items });
  }

  clear(): void {
    this.update({ restaurant: null, items: [] });
  }

  // Format attendu par POST /api/orders (pas de prix : le serveur les recalcule).
  toOrderLines(): { plat: string; quantite: number }[] {
    return this.state().items.map((item) => ({ plat: item.dishId, quantite: item.quantite }));
  }

  private find(dishId: string): CartItem | undefined {
    return this.state().items.find((item) => item.dishId === dishId);
  }

  private update(next: CartState): void {
    this.state.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Stockage indisponible : le panier reste en memoire.
    }
  }

  private load(): CartState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartState;
        if (Array.isArray(parsed.items)) {
          return { restaurant: parsed.restaurant ?? null, items: parsed.items };
        }
      }
    } catch {
      // Donnees corrompues : on repart d'un panier vide.
    }
    return { restaurant: null, items: [] };
  }

  private round(value: number): number {
    return Math.round(value * 1000) / 1000;
  }
}
