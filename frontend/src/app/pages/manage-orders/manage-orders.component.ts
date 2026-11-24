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
      <main class="fe-page orders-page">
        <header class="orders-header">
          <h1>Commandes reçues</h1>
          <div class="orders-tools">
            <label class="filter">
              <span class="fe-muted">Statut</span>
              <select [ngModel]="filter()" (ngModelChange)="onFilter($event)" name="filter">
                <option value="">Tous</option>
                @for (key of statusKeys; track key) {
                  <option [value]="key">{{ labels[key] }}</option>
                }
              </select>
            </label>
            <button type="button" class="fe-btn fe-btn-secondary" (click)="load()" [disabled]="isLoading()">Actualiser</button>
          </div>
        </header>

        @if (errorMessage()) {
          <p class="fe-alert fe-alert-error" role="alert">{{ errorMessage() }}</p>
        }

        @if (isLoading() && !orders().length) {
          <p class="fe-muted" role="status">Chargement des commandes…</p>
        } @else if (!orders().length) {
          <p class="fe-muted">Aucune commande à afficher.</p>
        } @else {
          <section class="orders-list" aria-label="Commandes">
            @for (order of orders(); track order._id) {
              <article class="order-card">
                <div class="order-main">
                  <h2>{{ clientName(order) }}</h2>
                  <span class="fe-muted">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }} · {{ order.articles.length }} article(s)</span>
                  <span class="fe-muted">{{ order.adresseLivraison }}</span>
                </div>
                <span [class]="'status status-' + order.statut">{{ labels[order.statut] }}</span>
                <strong>{{ order.total | number:'1.2-2' }} DT</strong>
                <div class="order-buttons">
                  @for (action of actionsFor(order); track action.statut) {
                    <button
                      type="button"
                      class="fe-btn"
                      [class.fe-btn-secondary]="action.danger"
                      [disabled]="busyId() === order._id"
                      (click)="changeStatus(order, action.statut, action.label)">
                      {{ action.label }}
                    </button>
                  }
                  <a class="fe-btn fe-btn-secondary" [routerLink]="['/restaurateur/orders', order._id]">Détails</a>
                </div>
              </article>
            }
          </section>

          <nav class="pager" aria-label="Pagination">
            <button type="button" class="fe-btn fe-btn-secondary" (click)="goTo(page() - 1)" [disabled]="page() <= 1">Précédent</button>
            <span class="fe-muted">Page {{ page() }} / {{ pages() }}</span>
            <button type="button" class="fe-btn fe-btn-secondary" (click)="goTo(page() + 1)" [disabled]="page() >= pages()">Suivant</button>
          </nav>
        }
      </main>
    </app-shell>
  `,
  styles: [`
    :host { display: block; }
    .orders-page { display: flex; flex-direction: column; gap: 20px; }
    .orders-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
    .orders-header h1 { margin: 0; }
    .orders-tools { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
    .filter { display: flex; flex-direction: column; gap: 4px; }
    .orders-list { display: flex; flex-direction: column; gap: 12px; }
    .order-card { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; align-items: center; gap: 16px; padding: 16px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); }
    .order-main { display: flex; flex-direction: column; gap: 2px; }
    .order-main h2 { margin: 0; font-size: 1.1rem; }
    .order-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
    .status { padding: 4px 12px; border-radius: 999px; font-size: 0.85rem; white-space: nowrap; background: var(--fe-surface-container); }
    .status-en_attente { background: #fbe9c3; color: #7a5600; }
    .status-acceptee { background: #d5e8f7; color: #1f5a8a; }
    .status-en_preparation { background: #dde3f7; color: #2d3f8a; }
    .status-en_livraison { background: #e8dcf5; color: #5a2d8a; }
    .status-livree { background: #dcefd6; color: #2f6b28; }
    .status-annulee { background: var(--fe-error-container); color: var(--fe-on-error-container); }
    .pager { display: flex; justify-content: center; align-items: center; gap: 16px; }
    @media (max-width: 900px) { .order-card { grid-template-columns: 1fr auto; } .order-buttons { grid-column: 1 / -1; } }
  `]
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
