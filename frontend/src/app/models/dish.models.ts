export const DISH_CATEGORIES = [
  'Entrées',
  'Plats principaux',
  'Pizzas',
  'Sandwichs',
  'Desserts',
  'Boissons'
] as const;

export type DishCategory = (typeof DISH_CATEGORIES)[number];

export interface Dish {
  _id: string;
  nom: string;
  imageUrl: string;
  description: string;
  prix: number;
  categorie: DishCategory;
  disponible: boolean;
  restaurant: string;
}

export interface DishRequest {
  nom: string;
  imageUrl: string;
  description: string;
  prix: number;
  categorie: DishCategory;
  disponible: boolean;
}
