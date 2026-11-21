import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="fe-app">
      <header class="fe-header">
        <div class="fe-header-inner">
          <a class="fe-brand" [routerLink]="homeRoute()" aria-label="FoodExpress">
            <span class="fe-brand-mark" aria-hidden="true">FE</span>
            <span class="fe-brand-name">FoodExpress</span>
          </a>

          @if (auth.currentUser(); as user) {
            <div class="fe-header-user">
              <span class="fe-user-avatar" aria-hidden="true">{{ (user.prenom || '').charAt(0) }}{{ (user.nom || '').charAt(0) }}</span>
              <span class="fe-user-name">{{ user.prenom }} {{ user.nom }}</span>
            </div>
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
  `
})
export class AppShellComponent {
  readonly auth = inject(AuthService);

  homeRoute(): string {
    return this.auth.getHomeRoute();
  }
}
