// Definit les statuts possibles d'un restaurant.
export type RestaurantStatus = 'pending' | 'approved' | 'suspended';

// Definit les filtres publics disponibles dans la liste.
export type RestaurantAvailability = 'all' | 'open' | 'closed';

// Definit les modes de tri disponibles.
export type RestaurantSort = 'alphabetical' | 'featured';

// Definit la structure complete d'un restaurant renvoyee par l'API.
export interface Restaurant {
  // Identifiant unique MongoDB.
  _id: string;
  // Nom public du restaurant.
  nom: string;
  // Description commerciale du restaurant.
  description: string;
  // Adresse utilisee pour les livraisons.
  adresse: string;
  // URL de l'image illustrative.
  imageUrl: string;
  // Type de cuisine propose.
  cuisineType: string;
  // Horaires d'ouverture sous forme textuelle.
  horaires: string;
  // Indique si le restaurant est ouvert.
  isOpen: boolean;
  // Frais de livraison calcules cote serveur.
  deliveryFee: number;
  // Statut administratif du restaurant.
  status: RestaurantStatus;
  // Indique si le restaurant est mis en avant.
  isFeatured: boolean;
  // Proprietaire ou informations minimales du proprietaire.
  owner: string | { _id: string; nom: string; prenom: string; email?: string };
  // Date de creation fournie par Mongoose.
  createdAt?: string;
  // Date de modification fournie par Mongoose.
  updatedAt?: string;
}

// Definit les informations envoyees lors d'une creation.
export interface RestaurantCreateRequest {
  nom: string;
  description: string;
  adresse: string;
  imageUrl: string;
  cuisineType: string;
  horaires: string;
  isOpen: boolean;
  deliveryFee: number;
  isFeatured: boolean;
}

// Definit les informations envoyees lors d'une modification.
//Partial means all properties become optional
//RestaurantUpdateRequest permet donc de modifier seulement une partie des propriétés.
//interface décrit directement la structure d’un objet, tandis qu’un type peut créer ou transformer un type existant. type ici devient interface
export type RestaurantUpdateRequest = Partial<RestaurantCreateRequest>;

// Definit les parametres de recherche public.
export interface RestaurantQuery {
  search: string;
  cuisine: string;
  availability: RestaurantAvailability;
  sort: RestaurantSort;
  page: number;
  limit: number;
}

// Definit la structure de pagination renvoyee par l'API.
export interface RestaurantPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
