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

export interface Order {
  _id: string;
  client: string;
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
