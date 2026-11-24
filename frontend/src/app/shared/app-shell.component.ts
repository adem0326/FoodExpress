import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="fe-app">
      <header class="fe-header">
        <div class="fe-header-inner">
          <a class="fe-brand" routerLink="/home" aria-label="FoodExpress">
            <span class="fe-brand-mark" aria-hidden="true">FE</span>
            <span class="fe-brand-name">FoodExpress</span>
          </a>
          <nav class="fe-header-nav" aria-label="Navigation principale">
            <a routerLink="/home" routerLinkActive="is-active">Accueil</a>
            <a routerLink="/restaurants" routerLinkActive="is-active">Restaurants</a>
            @if (auth.currentUser(); as user) {
              @if (user.role === 'client') {
                <a routerLink="/cart" routerLinkActive="is-active">Panier ({{ cart.count() }})</a>
                <a routerLink="/my-orders" routerLinkActive="is-active">Mes commandes</a>
              }
            }
          </nav>

          @if (auth.currentUser(); as user) {
            <a class="fe-header-user" [routerLink]="homeRoute()" aria-label="Ouvrir mon tableau de bord">
              <span class="fe-user-avatar" aria-hidden="true">{{ (user.prenom || '').charAt(0) }}{{ (user.nom || '').charAt(0) }}</span>
              <span class="fe-user-name">{{ user.prenom }} {{ user.nom }}</span>
            </a>
          }
        </div>
      </header>

      <ng-content />

      <footer class="fe-footer">
        <div class="fe-footer-inner">
          <span>FoodExpress · Terroir &amp; Restauration Artisanale</span>
          <span>Des saveurs locales, livrées avec soin.</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .fe-header-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-inline: auto;
    }

    .fe-header-nav a {
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      padding: 8px 16px;
      border: 1px solid transparent;
      border-radius: 999px;
      color: var(--fe-ink);
      font-family: var(--fe-font-display);
      font-size: var(--fe-label-lg-size);
      font-weight: 600;
      text-decoration: none;
      transition: background-color 0.2s, color 0.2s, border-color 0.2s;
    }

    .fe-header-nav a:hover {
      border-color: var(--fe-outline-variant);
      background: var(--fe-surface-container-low);
      color: var(--fe-primary);
    }

    .fe-header-nav a.is-active {
      background: var(--fe-secondary-container);
      color: var(--fe-on-secondary-container);
    }

    .fe-header-user {
      color: inherit;
      text-decoration: none;
      transition: border-color 0.2s, background-color 0.2s;
    }

    .fe-header-user:hover {
      border-color: var(--fe-primary);
      background: var(--fe-surface-container);
    }

    @media (max-width: 600px) {
      .fe-header-nav {
        gap: 4px;
      }

      .fe-header-nav a {
        padding-inline: 10px;
        font-size: var(--fe-label-sm-size);
      }
    }
  `]
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  homeRoute(): string {
    return this.auth.getHomeRoute();
  }
}
