import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDER_STATUS_LABELS, Order } from '../../models/order.models';
import { OrdersService } from '../../services/orders.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, AppShellComponent],
  template: `
    <app-shell>
      <main class="fe-page orders-page">
        <header class="orders-header">
          <h1>Mes commandes</h1>
          <button type="button" class="fe-btn fe-btn-secondary" (click)="load()" [disabled]="isLoading()">Actualiser</button>
        </header>

        @if (errorMessage()) {
          <p class="fe-alert fe-alert-error" role="alert">{{ errorMessage() }}</p>
        } @else if (isLoading() && !orders().length) {
          <p class="fe-muted" role="status">Chargement des commandes…</p>
        } @else if (!orders().length) {
          <p class="fe-muted">Vous n'avez pas encore passé de commande.</p>
          <a class="fe-btn fe-btn-secondary" routerLink="/restaurants">Découvrir les restaurants</a>
        } @else {
          <section class="orders-list" aria-label="Historique des commandes">
            @for (order of orders(); track order._id) {
              <article class="order-card">
                <div class="order-card-main">
                  <h2>{{ restaurantName(order) }}</h2>
                  <span class="fe-muted">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  <span class="fe-muted">{{ order.articles.length }} article(s)</span>
                </div>
                <span [class]="'status status-' + order.statut">{{ labels[order.statut] }}</span>
                <strong>{{ order.total | number:'1.2-2' }} DT</strong>
                <a class="fe-btn fe-btn-secondary" [routerLink]="['/my-orders', order._id]">Détails</a>
              </article>
            }
          </section>
        }
      </main>
    </app-shell>
  `,
  styles: [`
    :host { display: block; }
    .orders-page { display: flex; flex-direction: column; gap: 20px; }
    .orders-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .orders-header h1 { margin: 0; }
    .orders-list { display: flex; flex-direction: column; gap: 12px; }
    .order-card { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; align-items: center; gap: 16px; padding: 16px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); }
    .order-card-main { display: flex; flex-direction: column; gap: 2px; }
    .order-card-main h2 { margin: 0; font-size: 1.1rem; }
    .status { padding: 4px 12px; border-radius: 999px; font-size: 0.85rem; white-space: nowrap; background: var(--fe-surface-container); }
    .status-en_attente { background: #fbe9c3; color: #7a5600; }
    .status-acceptee { background: #d5e8f7; color: #1f5a8a; }
    .status-en_preparation { background: #dde3f7; color: #2d3f8a; }
    .status-en_livraison { background: #e8dcf5; color: #5a2d8a; }
    .status-livree { background: #dcefd6; color: #2f6b28; }
    .status-annulee { background: var(--fe-error-container); color: var(--fe-on-error-container); }
    @media (max-width: 700px) { .order-card { grid-template-columns: 1fr auto; } }
  `]
})
export class MyOrdersComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);

  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly labels = ORDER_STATUS_LABELS;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.ordersService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger vos commandes');
        this.isLoading.set(false);
      }
    });
  }

  restaurantName(order: Order): string {
    return typeof order.restaurant === 'string' ? 'Restaurant' : order.restaurant.nom;
  }
}
