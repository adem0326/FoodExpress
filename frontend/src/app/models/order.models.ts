export type OrderStatus =
  | 'en_attente'
  | 'acceptee'
  | 'en_preparation'
  | 'en_livraison'
  | 'livree'
  | 'annulee';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée'
};

// Classes Bootstrap utilisees pour les badges de statut.
export const ORDER_STATUS_BADGES: Record<OrderStatus, string> = {
  en_attente: 'bg-warning text-dark',
  acceptee: 'bg-info text-dark',
  en_preparation: 'bg-primary',
  en_livraison: 'bg-secondary',
  livree: 'bg-success',
  annulee: 'bg-danger'
};

export interface OrderItem {
  plat: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
}

export interface OrderRestaurant {
  _id: string;
  nom: string;
  imageUrl?: string;
  adresse?: string;
}

export interface OrderClient {
  _id: string;
  nom: string;
  prenom: string;
  telephone?: string;
}

export interface Order {
  _id: string;
  client: OrderClient | string;
  restaurant: OrderRestaurant | string;
  articles: OrderItem[];
  adresseLivraison: string;
  remarque: string;
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  modePaiement: 'livraison';
  statut: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// Le serveur recalcule tous les montants : on n'envoie que les identifiants et quantites.
export interface CreateOrderPayload {
  articles: { plat: string; quantite: number }[];
  adresseLivraison: string;
  remarque?: string;
  modePaiement: 'livraison';
}

// --- Panier (cote Angular uniquement) ---

export interface CartItem {
  dishId: string;
  nom: string;
  prix: number;
  imageUrl: string;
  quantite: number;
}

export interface CartRestaurant {
  id: string;
  nom: string;
  deliveryFee: number;
}

// --- Etudiant 5 : traitement des commandes et statistiques ---

// Actions possibles pour le restaurateur selon le statut actuel (miroir du cycle de vie du serveur).
export interface StatusAction {
  statut: OrderStatus;
  label: string;
  danger?: boolean;
}

export const ORDER_STATUS_ACTIONS: Record<OrderStatus, StatusAction[]> = {
  en_attente: [
    { statut: 'acceptee', label: 'Accepter' },
    { statut: 'annulee', label: 'Refuser', danger: true }
  ],
  acceptee: [
    { statut: 'en_preparation', label: 'Passer en préparation' },
    { statut: 'annulee', label: 'Annuler', danger: true }
  ],
  en_preparation: [
    { statut: 'en_livraison', label: 'Passer en livraison' },
    { statut: 'annulee', label: 'Annuler', danger: true }
  ],
  en_livraison: [{ statut: 'livree', label: 'Marquer comme livrée' }],
  livree: [],
  annulee: []
};

export interface RestaurantOrdersResponse {
  orders: Order[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface RestaurateurStats {
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  byStatus: Partial<Record<OrderStatus, number>>;
  revenue: number;
  topDishes: { plat: string; nom: string; quantite: number }[];
}

export interface AdminStats {
  clients: number;
  restaurants: number;
  orders: number;
  revenue: number;
}
