import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ORDER_STATUS_LABELS, Order, OrderStatus } from '../../models/order.models';
import { OrdersService } from '../../services/orders.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, AppShellComponent],
  template: `
    <app-shell>
      <main class="fe-page order-page">
        @if (errorMessage()) {
          <p class="fe-alert fe-alert-error" role="alert">{{ errorMessage() }}</p>
        } @else if (order(); as order) {
          @if (isNew()) {
            <p class="fe-alert order-success" role="status">Votre commande a bien été envoyée au restaurant.</p>
          }

          <header class="order-header">
            <div>
              <h1>Commande · {{ restaurantName() }}</h1>
              <span class="fe-muted">Passée le {{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <span [class]="'status status-' + order.statut">{{ labels[order.statut] }}</span>
          </header>

          @if (order.statut === 'annulee') {
            <p class="fe-alert fe-alert-error">Cette commande a été annulée.</p>
          } @else {
            <ol class="order-steps" aria-label="Suivi de la commande">
              @for (step of steps; track step; let i = $index) {
                <li [class.is-done]="i <= currentStep()" [class.is-current]="i === currentStep()">
                  <span class="step-dot" aria-hidden="true">{{ i + 1 }}</span>
                  <span>{{ labels[step] }}</span>
                </li>
              }
            </ol>
          }

          <section class="order-box" aria-label="Articles">
            <table>
              <thead>
                <tr><th>Article</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr>
              </thead>
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

          <section class="order-box order-info">
            <p><strong>Adresse de livraison :</strong> {{ order.adresseLivraison }}</p>
            @if (order.remarque) {
              <p><strong>Remarque :</strong> {{ order.remarque }}</p>
            }
            <p><strong>Paiement :</strong> Paiement à la livraison</p>
          </section>
        } @else {
          <p class="fe-muted" role="status">Chargement de la commande…</p>
        }

        <div class="order-actions">
          <button type="button" class="fe-btn fe-btn-secondary" (click)="load()">Actualiser</button>
          <a class="fe-btn fe-btn-secondary" routerLink="/my-orders">Retour à mes commandes</a>
        </div>
      </main>
    </app-shell>
  `,
  styles: [`
    :host { display: block; }
    .order-page { display: flex; flex-direction: column; gap: 20px; }
    .order-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .order-header h1 { margin: 0 0 4px; }
    .order-success { background: #dcefd6; color: #2f6b28; padding: 12px 16px; border-radius: 10px; }
    .status { padding: 4px 12px; border-radius: 999px; font-size: 0.85rem; white-space: nowrap; background: var(--fe-surface-container); }
    .status-en_attente { background: #fbe9c3; color: #7a5600; }
    .status-acceptee { background: #d5e8f7; color: #1f5a8a; }
    .status-en_preparation { background: #dde3f7; color: #2d3f8a; }
    .status-en_livraison { background: #e8dcf5; color: #5a2d8a; }
    .status-livree { background: #dcefd6; color: #2f6b28; }
    .status-annulee { background: var(--fe-error-container); color: var(--fe-on-error-container); }
    .order-steps { display: flex; flex-wrap: wrap; gap: 16px; list-style: none; margin: 0; padding: 0; }
    .order-steps li { display: flex; align-items: center; gap: 8px; color: var(--fe-on-surface-variant); }
    .order-steps li.is-done { color: #2f6b28; }
    .order-steps li.is-current { font-weight: 700; }
    .step-dot { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--fe-surface-container); font-size: 0.8rem; }
    .is-done .step-dot { background: #2f6b28; color: white; }
    .order-box { padding: 20px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); overflow-x: auto; }
    .order-box table { width: 100%; border-collapse: collapse; }
    .order-box th, .order-box td { padding: 8px; text-align: left; border-bottom: 1px solid var(--fe-card-border); }
    .order-totals { display: flex; flex-direction: column; gap: 6px; max-width: 320px; margin: 16px 0 0 auto; }
    .order-totals > div { display: flex; justify-content: space-between; gap: 12px; }
    .order-total { padding-top: 8px; border-top: 1px solid var(--fe-card-border); font-size: 1.1rem; }
    .order-info p { margin: 0 0 8px; }
    .order-actions { display: flex; flex-wrap: wrap; gap: 12px; }
  `]
})
export class OrderDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);

  readonly order = signal<Order | null>(null);
  readonly errorMessage = signal('');
  readonly isNew = signal(false);
  readonly labels = ORDER_STATUS_LABELS;
  readonly steps: OrderStatus[] = ['en_attente', 'acceptee', 'en_preparation', 'en_livraison', 'livree'];

  readonly currentStep = computed(() => {
    const order = this.order();
    return order ? this.steps.indexOf(order.statut) : -1;
  });

  ngOnInit(): void {
    this.isNew.set(this.route.snapshot.queryParamMap.has('nouvelle'));
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Identifiant de commande manquant');
      return;
    }
    this.ordersService.getById(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.errorMessage.set('');
      },
      error: () => this.errorMessage.set('Impossible de charger cette commande')
    });
  }

  restaurantName(): string {
    const restaurant = this.order()?.restaurant;
    return !restaurant || typeof restaurant === 'string' ? 'Restaurant' : restaurant.nom;
  }
}
