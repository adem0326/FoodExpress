import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [DecimalPipe, RouterLink, AppShellComponent],
  template: `
    <app-shell>
      <main class="fe-page cart-page">
        <h1>Mon panier</h1>

        @if (cart.isEmpty()) {
          <p class="fe-muted">Votre panier est vide.</p>
          <a class="fe-btn fe-btn-secondary" routerLink="/restaurants">Découvrir les restaurants</a>
        } @else {
          <p class="fe-muted">Restaurant : <strong>{{ cart.restaurant()?.nom }}</strong></p>

          <section class="cart-lines" aria-label="Articles du panier">
            @for (item of cart.items(); track item.dishId) {
              <article class="cart-line">
                <img [src]="item.imageUrl || 'https://placehold.co/160x120/e8d7b9/6b4430?text=FoodExpress'" [alt]="item.nom" />
                <div class="cart-line-info">
                  <h2>{{ item.nom }}</h2>
                  <span class="fe-muted">{{ item.prix | number:'1.2-2' }} DT / unité</span>
                </div>
                <div class="cart-qty" role="group" [attr.aria-label]="'Quantité de ' + item.nom">
                  <button type="button" class="fe-btn fe-btn-secondary" (click)="cart.decrease(item.dishId)" aria-label="Diminuer">−</button>
                  <span>{{ item.quantite }}</span>
                  <button type="button" class="fe-btn fe-btn-secondary" (click)="cart.increase(item.dishId)" aria-label="Augmenter">+</button>
                </div>
                <strong class="cart-line-total">{{ item.prix * item.quantite | number:'1.2-2' }} DT</strong>
                <button type="button" class="fe-btn fe-btn-secondary" (click)="cart.remove(item.dishId)">Supprimer</button>
              </article>
            }
          </section>

          <aside class="cart-summary" aria-label="Récapitulatif">
            <div><span>Sous-total</span><strong>{{ cart.subtotal() | number:'1.2-2' }} DT</strong></div>
            <div><span>Livraison</span><strong>{{ cart.deliveryFee() | number:'1.2-2' }} DT</strong></div>
            <div class="cart-total"><span>Total à payer</span><strong>{{ cart.total() | number:'1.2-2' }} DT</strong></div>
            <div class="cart-actions">
              <a class="fe-btn fe-btn-primary" routerLink="/checkout">Passer la commande</a>
              <button type="button" class="fe-btn fe-btn-secondary" (click)="cart.clear()">Vider le panier</button>
            </div>
          </aside>
        }
      </main>
    </app-shell>
  `,
  styles: [`
    :host { display: block; }
    .cart-page { display: flex; flex-direction: column; gap: 20px; }
    .cart-lines { display: flex; flex-direction: column; gap: 12px; }
    .cart-line { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto auto auto; align-items: center; gap: 16px; padding: 12px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); }
    .cart-line img { width: 96px; height: 72px; object-fit: cover; border-radius: 10px; }
    .cart-line-info h2 { margin: 0 0 4px; font-size: 1.05rem; }
    .cart-qty { display: flex; align-items: center; gap: 10px; }
    .cart-qty span { min-width: 24px; text-align: center; font-weight: 600; }
    .cart-line-total { white-space: nowrap; color: var(--fe-primary); }
    .cart-summary { display: flex; flex-direction: column; gap: 10px; max-width: 420px; align-self: flex-end; width: 100%; padding: 20px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); }
    .cart-summary > div { display: flex; justify-content: space-between; gap: 12px; }
    .cart-total { padding-top: 10px; border-top: 1px solid var(--fe-card-border); font-size: 1.15rem; }
    .cart-actions { flex-direction: column; }
    @media (max-width: 700px) {
      .cart-line { grid-template-columns: 72px minmax(0, 1fr); }
      .cart-line img { width: 72px; height: 56px; }
      .cart-summary { max-width: none; }
    }
  `]
})
export class CartComponent {
  readonly cart = inject(CartService);
}
