import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ORDER_STATUS_ACTIONS, ORDER_STATUS_LABELS, Order, OrderClient, OrderStatus } from '../../models/order.models';
import { OrdersService } from '../../services/orders.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-manage-order-details',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, AppShellComponent],
  template: `
    <app-shell>
      <main class="fe-container fe-page restaurant-order-detail-page">
        @if (errorMessage()) {
          <p class="fe-alert fe-alert-error" role="alert">{{ errorMessage() }}</p>
        }
        @if (order(); as order) {
          <header class="order-detail-header">
            <div class="order-detail-heading">
              <a class="order-detail-back" routerLink="/restaurateur/orders">
                <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                Retour aux commandes
              </a>
              <span class="order-detail-kicker">Commande #{{ order._id.slice(-6) }}</span>
              <h1>Détail de la commande</h1>
              <p>Reçue le {{ order.createdAt | date:'dd/MM/yyyy à HH:mm' }}</p>
            </div>
            <div class="order-detail-header-meta">
              <span [class]="'order-detail-status status-' + order.statut">
                <span class="order-detail-status-dot" aria-hidden="true"></span>
                {{ labels[order.statut] }}
              </span>
              <div class="order-detail-client-chip">
                <span class="order-detail-client-avatar" aria-hidden="true">{{ clientName().slice(0, 1).toUpperCase() }}</span>
                <div>
                  <strong>{{ clientName() }}</strong>
                  @if (clientPhone()) {
                    <span>{{ clientPhone() }}</span>
                  } @else {
                    <span>Client FoodExpress</span>
                  }
                </div>
              </div>
            </div>
          </header>

          <div class="order-detail-layout">
            <div class="order-detail-main">
              <section class="order-detail-card" aria-labelledby="order-items-title">
                <header class="order-detail-card-heading">
                  <div class="order-detail-heading-icon">
                    <span class="material-symbols-outlined" aria-hidden="true">restaurant_menu</span>
                  </div>
                  <div>
                    <h2 id="order-items-title">Articles commandés</h2>
                    <p>{{ order.articles.length }} article(s) dans cette commande</p>
                  </div>
                </header>
                <div class="order-detail-items">
                @for (item of order.articles; track item.plat) {
                  <article class="order-detail-item">
                    <span class="order-detail-item-icon" aria-hidden="true">
                      <span class="material-symbols-outlined">lunch_dining</span>
                    </span>
                    <div class="order-detail-item-copy">
                      <h3>{{ item.nom }}</h3>
                      <span>{{ item.quantite }} × {{ item.prixUnitaire | number:'1.2-2' }} DT</span>
                    </div>
                    <strong>{{ item.prixUnitaire * item.quantite | number:'1.2-2' }} DT</strong>
                  </article>
                }
                </div>
              </section>

              <section class="order-detail-card order-delivery-card" aria-labelledby="delivery-title">
                <header class="order-detail-card-heading">
                  <div class="order-detail-heading-icon">
                    <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
                  </div>
                  <div>
                    <h2 id="delivery-title">Livraison</h2>
                    <p>Informations nécessaires à la remise de la commande</p>
                  </div>
                </header>
                <div class="order-detail-info-grid">
                  <div>
                    <span class="order-detail-info-label">Adresse de livraison</span>
                    <strong>{{ order.adresseLivraison }}</strong>
                  </div>
                  <div>
                    <span class="order-detail-info-label">Mode de paiement</span>
                    <strong>
                      <span class="material-symbols-outlined" aria-hidden="true">payments</span>
                      Paiement à la livraison
                    </strong>
                  </div>
                  @if (clientPhone()) {
                    <div>
                      <span class="order-detail-info-label">Téléphone du client</span>
                      <strong>
                        <span class="material-symbols-outlined" aria-hidden="true">call</span>
                        {{ clientPhone() }}
                      </strong>
                    </div>
                  }
                </div>
                @if (order.remarque) {
                  <div class="order-customer-note">
                    <span class="material-symbols-outlined" aria-hidden="true">chat</span>
                    <div>
                      <span class="order-detail-info-label">Note du client</span>
                      <p>{{ order.remarque }}</p>
                    </div>
                  </div>
                }
              </section>
            </div>

            <aside class="order-detail-sidebar">
              <section class="order-detail-card order-totals-card" aria-labelledby="order-total-title">
                <header class="order-detail-card-heading">
                  <div class="order-detail-heading-icon">
                    <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                  </div>
                  <div>
                    <h2 id="order-total-title">Récapitulatif</h2>
                    <p>Montant de la commande</p>
                  </div>
                </header>
                <div class="order-totals">
                  <div><span>Sous-total</span><strong>{{ order.sousTotal | number:'1.2-2' }} DT</strong></div>
                  <div><span>Frais de livraison</span><strong>{{ order.fraisLivraison | number:'1.2-2' }} DT</strong></div>
                  <div class="order-grand-total"><span>Total</span><strong>{{ order.total | number:'1.2-2' }} <small>DT</small></strong></div>
                </div>
              </section>

              <section class="order-detail-card order-management-card" aria-labelledby="order-actions-title">
                <header class="order-detail-card-heading">
                  <div class="order-detail-heading-icon">
                    <span class="material-symbols-outlined" aria-hidden="true">task_alt</span>
                  </div>
                  <div>
                    <h2 id="order-actions-title">Suivi de la commande</h2>
                    <p>Statut actuel : {{ labels[order.statut] }}</p>
                  </div>
                </header>
                <div class="order-management-actions">
                  @for (action of actions(); track action.statut) {
                    <button
                      type="button"
                      class="fe-btn"
                      [class.fe-btn-primary]="!action.danger"
                      [class.fe-btn-secondary]="action.danger"
                      [disabled]="isBusy()"
                      (click)="change(action.statut)">
                      {{ action.label }}
                    </button>
                  }
                  @if (!actions().length) {
                    <p class="order-finished-message">
                      <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                      Cette commande est terminée et ne peut plus être modifiée.
                    </p>
                  }
                </div>
              </section>
            </aside>
          </div>
        } @else if (!errorMessage()) {
          <section class="order-detail-loading" role="status">
            <span class="material-symbols-outlined" aria-hidden="true">progress_activity</span>
            Chargement de la commande…
          </section>
        }
      </main>
    </app-shell>
  `,
  styles: [':host { display: block; }']
})
export class ManageOrderDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);

  readonly labels = ORDER_STATUS_LABELS;
  readonly order = signal<Order | null>(null);
  readonly errorMessage = signal('');
  readonly isBusy = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Identifiant de commande manquant');
      return;
    }
    this.ordersService.getRestaurantOrderById(id).subscribe({
      next: (order) => this.order.set(order),
      error: (error) => this.errorMessage.set(error.error?.message ?? 'Impossible de charger cette commande')
    });
  }

  actions() {
    const order = this.order();
    return order ? ORDER_STATUS_ACTIONS[order.statut] : [];
  }

  change(statut: OrderStatus): void {
    const order = this.order();
    if (!order) return;
    if (statut === 'annulee' && !confirm('Confirmer ? Cette action est définitive.')) return;
    this.isBusy.set(true);
    this.errorMessage.set('');
    this.ordersService.updateStatus(order._id, statut).subscribe({
      next: () => {
        this.isBusy.set(false);
        this.load();
      },
      error: (error) => {
        this.isBusy.set(false);
        this.errorMessage.set(error.error?.message ?? 'Mise à jour impossible');
      }
    });
  }

  clientName(): string {
    const client = this.order()?.client as OrderClient | string | undefined;
    return !client || typeof client === 'string' ? 'Client' : `${client.prenom} ${client.nom}`;
  }

  clientPhone(): string {
    const client = this.order()?.client as OrderClient | string | undefined;
    return !client || typeof client === 'string' ? '' : client.telephone ?? '';
  }
}
