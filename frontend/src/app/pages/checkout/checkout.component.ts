import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrdersService } from '../../services/orders.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, AppShellComponent],
  template: `
    <app-shell>
      <main class="fe-page checkout-page">
        <h1>Confirmer la commande</h1>

        @if (cart.isEmpty()) {
          <p class="fe-muted">Votre panier est vide.</p>
          <a class="fe-btn fe-btn-secondary" routerLink="/restaurants">Découvrir les restaurants</a>
        } @else {
          <div class="checkout-grid">
            <form class="checkout-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <label for="adresse">Adresse de livraison *</label>
              <textarea id="adresse" rows="3" formControlName="adresseLivraison"
                        placeholder="Ex : 12 Avenue Habib Bourguiba, Tunis"></textarea>
              @if (form.controls.adresseLivraison.touched && form.controls.adresseLivraison.invalid) {
                <small class="field-error" role="alert">
                  @if (form.controls.adresseLivraison.hasError('required')) {
                    L'adresse de livraison est requise.
                  } @else {
                    L'adresse ne doit pas dépasser 300 caractères.
                  }
                </small>
              }

              <label for="remarque">Remarque (facultatif)</label>
              <textarea id="remarque" rows="2" formControlName="remarque" placeholder="Ex : sans oignons"></textarea>
              @if (form.controls.remarque.invalid) {
                <small class="field-error" role="alert">La remarque ne doit pas dépasser 500 caractères.</small>
              }

              <fieldset>
                <legend>Mode de paiement</legend>
                <label class="payment-option">
                  <input type="radio" checked disabled /> Paiement à la livraison
                </label>
                <label class="payment-option is-disabled">
                  <input type="radio" disabled /> Paiement en ligne (bientôt disponible)
                </label>
              </fieldset>

              @if (errorMessage()) {
                <p class="fe-alert fe-alert-error" role="alert">{{ errorMessage() }}</p>
              }

              <div class="checkout-actions">
                <button type="submit" class="fe-btn fe-btn-primary" [disabled]="isSubmitting()">
                  {{ isSubmitting() ? 'Envoi en cours…' : 'Confirmer la commande' }}
                </button>
                <a class="fe-btn fe-btn-secondary" routerLink="/cart">Retour au panier</a>
              </div>
            </form>

            <aside class="checkout-summary" aria-label="Récapitulatif">
              <h2>{{ cart.restaurant()?.nom }}</h2>
              <ul>
                @for (item of cart.items(); track item.dishId) {
                  <li>
                    <span>{{ item.quantite }} × {{ item.nom }}</span>
                    <strong>{{ item.prix * item.quantite | number:'1.2-2' }} DT</strong>
                  </li>
                }
              </ul>
              <div><span>Sous-total</span><strong>{{ cart.subtotal() | number:'1.2-2' }} DT</strong></div>
              <div><span>Livraison</span><strong>{{ cart.deliveryFee() | number:'1.2-2' }} DT</strong></div>
              <div class="checkout-total"><span>Total à payer</span><strong>{{ cart.total() | number:'1.2-2' }} DT</strong></div>
              <small class="fe-muted">Le montant final est vérifié par le serveur.</small>
            </aside>
          </div>
        }
      </main>
    </app-shell>
  `,
  styles: [`
    :host { display: block; }
    .checkout-page { display: flex; flex-direction: column; gap: 20px; }
    .checkout-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 24px; align-items: start; }
    .checkout-form, .checkout-summary { display: flex; flex-direction: column; gap: 10px; padding: 20px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); }
    .checkout-form textarea { width: 100%; padding: 10px; border: 1px solid var(--fe-outline-variant); border-radius: 10px; font: inherit; resize: vertical; }
    .checkout-form fieldset { display: flex; flex-direction: column; gap: 6px; border: 0; padding: 0; margin: 8px 0 0; }
    .payment-option { display: flex; align-items: center; gap: 8px; }
    .payment-option.is-disabled { opacity: 0.55; }
    .field-error { color: var(--fe-error); }
    .checkout-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
    .checkout-summary h2 { margin: 0; font-size: 1.15rem; }
    .checkout-summary ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
    .checkout-summary li, .checkout-summary > div { display: flex; justify-content: space-between; gap: 12px; }
    .checkout-total { padding-top: 10px; border-top: 1px solid var(--fe-card-border); font-size: 1.15rem; }
    @media (max-width: 800px) { .checkout-grid { grid-template-columns: 1fr; } }
  `]
})
export class CheckoutComponent {
  readonly cart = inject(CartService);
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    adresseLivraison: ['', [Validators.required, Validators.maxLength(300)]],
    remarque: ['', [Validators.maxLength(500)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.cart.isEmpty() || this.isSubmitting()) {
      return;
    }

    const { adresseLivraison, remarque } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.ordersService
      .create({
        articles: this.cart.toOrderLines(),
        adresseLivraison,
        remarque,
        modePaiement: 'livraison'
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          this.isSubmitting.set(false);
          this.router.navigate(['/my-orders', order._id], { queryParams: { nouvelle: 1 } });
        },
        error: (error: { error?: { message?: string } }) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(error.error?.message ?? 'Impossible de créer la commande');
        }
      });
  }
}
