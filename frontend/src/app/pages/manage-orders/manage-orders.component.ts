import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ORDER_STATUS_ACTIONS,
  ORDER_STATUS_LABELS,
  Order,
  OrderClient,
  OrderStatus
} from '../../models/order.models';
import { OrdersService } from '../../services/orders.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-manage-orders',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, AppShellComponent],
  template: `
    <app-shell>
      <main class="fe-container fe-page restaurant-orders-page">
        <header class="orders-hero">
          <div>
            <span class="fe-badge fe-badge-warm">
              <span class="material-symbols-outlined" aria-hidden="true">restaurant</span>
              Espace restaurateur
            </span>
            <h1>Gestion des commandes</h1>
            <p>Suivez et traitez les commandes de vos clients depuis un seul endroit.</p>
          </div>
          <div class="orders-hero-actions">
            <span class="orders-live-indicator">
              <span aria-hidden="true"></span>
              {{ orders().length }} commande(s) sur cette page
            </span>
            <button type="button" class="fe-btn fe-btn-secondary" (click)="load()" [disabled]="isLoading()">
              <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
              {{ isLoading() ? 'Actualisation…' : 'Actualiser' }}
            </button>
          </div>
        </header>

        @if (errorMessage()) {
          <p class="fe-alert fe-alert-error" role="alert">{{ errorMessage() }}</p>
        }

        <section class="orders-toolbar" aria-label="Filtres des commandes">
          <div class="orders-toolbar-copy">
            <h2>Commandes reçues</h2>
            <p>Consultez et filtrez les commandes de votre restaurant.</p>
          </div>
          <label class="orders-filter">
            <span class="material-symbols-outlined" aria-hidden="true">filter_list</span>
            <span>Filtrer par statut</span>
            <select [ngModel]="filter()" (ngModelChange)="onFilter($event)" name="filter">
              <option value="">Tous les statuts</option>
              @for (key of statusKeys; track key) {
                <option [value]="key">{{ labels[key] }}</option>
              }
            </select>
          </label>
        </section>

        @if (isLoading() && !orders().length) {
          <section class="orders-state" role="status">
            <span class="material-symbols-outlined" aria-hidden="true">progress_activity</span>
            <p>Chargement des commandes…</p>
          </section>
        } @else if (!orders().length) {
          <section class="orders-state">
            <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
            <h2>Aucune commande à traiter</h2>
            <p>Les nouvelles commandes apparaîtront ici.</p>
          </section>
        } @else {
          <section class="orders-panel" aria-label="Commandes reçues">
            <div class="orders-list">
            @for (order of orders(); track order._id) {
              <article class="restaurant-order-card">
                <div class="order-card-top">
                  <div class="order-id-block">
                    <strong class="order-number">#{{ order._id.slice(-6) }}</strong>
                    <span [class]="'orders-status status-' + order.statut">
                      <span class="orders-status-dot" aria-hidden="true"></span>
                      {{ labels[order.statut] }}
                    </span>
                  </div>
                  <span class="order-date">{{ order.createdAt | date:'dd/MM/yyyy · HH:mm' }}</span>
                </div>

                <div class="order-card-content">
                  <div class="order-customer">
                    <span class="order-customer-avatar" aria-hidden="true">{{ clientName(order).slice(0, 1).toUpperCase() }}</span>
                    <div>
                      <h3>{{ clientName(order) }}</h3>
                      <span>{{ order.articles.length }} article(s)</span>
                    </div>
                  </div>

                  <div class="order-items" aria-label="Articles commandés">
                    <span class="order-items-label">Récapitulatif du panier</span>
                    @for (item of order.articles; track item.plat) {
                      <div class="order-item">
                        <span><strong>{{ item.quantite }} ×</strong> {{ item.nom }}</span>
                        <span>{{ item.prixUnitaire * item.quantite | number:'1.2-2' }} DT</span>
                      </div>
                    }
                  </div>

                  <div class="order-delivery-info">
                    <span>
                      <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
                      {{ order.adresseLivraison }}
                    </span>
                    <span>
                      <span class="material-symbols-outlined" aria-hidden="true">payments</span>
                      Paiement à la livraison
                    </span>
                    @if (order.remarque) {
                      <span class="order-note">
                        <span class="material-symbols-outlined" aria-hidden="true">chat</span>
                        {{ order.remarque }}
                      </span>
                    }
                  </div>

                  <div class="order-total">
                    <span>Total à encaisser</span>
                    <strong>{{ order.total | number:'1.2-2' }} <small>DT</small></strong>
                  </div>
                </div>

                <div class="order-card-actions">
                  <div class="order-status-actions">
                    @for (action of actionsFor(order); track action.statut) {
                    <button
                      type="button"
                      class="fe-btn"
                      [class.fe-btn-primary]="!action.danger"
                      [class.fe-btn-secondary]="action.danger"
                      [disabled]="busyId() === order._id"
                      (click)="changeStatus(order, action.statut, action.label)">
                      {{ action.label }}
                    </button>
                  }
                  </div>
                  <a class="fe-btn fe-btn-secondary order-details-link" [routerLink]="['/restaurateur/orders', order._id]">
                    <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                    Détails
                  </a>
                </div>
              </article>
            }
            </div>
          </section>

          <nav class="orders-pager" aria-label="Pagination des commandes">
            <span>{{ orders().length }} commande(s) affichée(s) · Page {{ page() }} / {{ pages() }}</span>
            <div>
              <button type="button" class="fe-btn fe-btn-secondary" (click)="goTo(page() - 1)" [disabled]="page() <= 1">
                <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                Précédent
              </button>
              <button type="button" class="fe-btn fe-btn-secondary" (click)="goTo(page() + 1)" [disabled]="page() >= pages()">
                Suivant
                <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </button>
            </div>
          </nav>
        }
      </main>
    </app-shell>
  `,
  styles: [':host { display: block; }']
})
export class ManageOrdersComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);

  readonly labels = ORDER_STATUS_LABELS;
  readonly statusKeys = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

  readonly orders = signal<Order[]>([]);
  readonly filter = signal<OrderStatus | ''>('');
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly isLoading = signal(false);
  readonly busyId = signal('');
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.ordersService.getRestaurantOrders(this.filter(), this.page()).subscribe({
      next: ({ orders, pagination }) => {
        this.orders.set(orders);
        this.pages.set(pagination.pages);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les commandes');
        this.isLoading.set(false);
      }
    });
  }

  onFilter(value: OrderStatus | ''): void {
    this.filter.set(value);
    this.page.set(1);
    this.load();
  }

  goTo(page: number): void {
    this.page.set(Math.min(Math.max(page, 1), this.pages()));
    this.load();
  }

  actionsFor(order: Order) {
    return ORDER_STATUS_ACTIONS[order.statut];
  }

  changeStatus(order: Order, statut: OrderStatus, label: string): void {
    if (statut === 'annulee' && !confirm('Confirmer ? Cette action est définitive.')) return;
    this.busyId.set(order._id);
    this.errorMessage.set('');
    this.ordersService.updateStatus(order._id, statut).subscribe({
      next: () => {
        this.busyId.set('');
        this.load();
      },
      error: (error) => {
        this.busyId.set('');
        this.errorMessage.set(error.error?.message ?? `Action impossible : ${label}`);
      }
    });
  }

  clientName(order: Order): string {
    const client = order.client as OrderClient | string;
    return typeof client === 'string' ? 'Client' : `${client.prenom} ${client.nom}`;
  }
}
