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
      <main class="fe-page order-page">
        @if (errorMessage()) {
          <p class="fe-alert fe-alert-error" role="alert">{{ errorMessage() }}</p>
        }
        @if (order(); as order) {
          <header class="order-header">
            <div>
              <h1>Commande de {{ clientName() }}</h1>
              <span class="fe-muted">Reçue le {{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              @if (clientPhone()) {
                <span class="fe-muted"> · Tél. {{ clientPhone() }}</span>
              }
            </div>
            <span [class]="'status status-' + order.statut">{{ labels[order.statut] }}</span>
          </header>

          <section class="order-box" aria-label="Articles">
            <table>
              <thead><tr><th>Article</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead>
              <tbody>
                @for (item of order.articles; track item.plat) {
                  <tr>
                    <td>{{ item.nom }}</td>
                    <td>{{ item.quantite }}</td>
                    <td>{{ item.prixUnitaire | number:'1.2-2' }} DT</td>
                    <td>{{ item.prixUnitaire * item.quantite | number:'1.2-2' }} DT</td>
                  </tr>
                }
              </tbody>
            </table>
            <div class="order-totals">
              <div><span>Sous-total</span><strong>{{ order.sousTotal | number:'1.2-2' }} DT</strong></div>
              <div><span>Livraison</span><strong>{{ order.fraisLivraison | number:'1.2-2' }} DT</strong></div>
              <div class="order-total"><span>Total</span><strong>{{ order.total | number:'1.2-2' }} DT</strong></div>
            </div>
          </section>

          <section class="order-box">
            <p><strong>Adresse de livraison :</strong> {{ order.adresseLivraison }}</p>
            @if (order.remarque) {
              <p><strong>Remarque :</strong> {{ order.remarque }}</p>
            }
            <p><strong>Paiement :</strong> Paiement à la livraison</p>
          </section>

          <div class="order-actions">
            @for (action of actions(); track action.statut) {
              <button type="button" class="fe-btn" [class.fe-btn-secondary]="action.danger" [disabled]="isBusy()" (click)="change(action.statut)">
                {{ action.label }}
              </button>
            }
            @if (!actions().length) {
              <span class="fe-muted">Cette commande est terminée et ne peut plus être modifiée.</span>
            }
          </div>
        } @else if (!errorMessage()) {
          <p class="fe-muted" role="status">Chargement de la commande…</p>
        }

        <div class="order-actions">
          <a class="fe-btn fe-btn-secondary" routerLink="/restaurateur/orders">Retour aux commandes</a>
        </div>
      </main>
    </app-shell>
  `,
  styles: [`
    :host { display: block; }
    .order-page { display: flex; flex-direction: column; gap: 20px; }
    .order-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .order-header h1 { margin: 0 0 4px; }
    .status { padding: 4px 12px; border-radius: 999px; font-size: 0.85rem; white-space: nowrap; background: var(--fe-surface-container); }
    .status-en_attente { background: #fbe9c3; color: #7a5600; }
    .status-acceptee { background: #d5e8f7; color: #1f5a8a; }
    .status-en_preparation { background: #dde3f7; color: #2d3f8a; }
    .status-en_livraison { background: #e8dcf5; color: #5a2d8a; }
    .status-livree { background: #dcefd6; color: #2f6b28; }
    .status-annulee { background: var(--fe-error-container); color: var(--fe-on-error-container); }
    .order-box { padding: 20px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); overflow-x: auto; }
    .order-box table { width: 100%; border-collapse: collapse; }
    .order-box th, .order-box td { padding: 8px; text-align: left; border-bottom: 1px solid var(--fe-card-border); }
    .order-box p { margin: 0 0 8px; }
    .order-totals { display: flex; flex-direction: column; gap: 6px; max-width: 320px; margin: 16px 0 0 auto; }
    .order-totals > div { display: flex; justify-content: space-between; gap: 12px; }
    .order-total { padding-top: 8px; border-top: 1px solid var(--fe-card-border); font-size: 1.1rem; }
    .order-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  `]
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
