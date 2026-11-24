import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RestaurateurStats } from '../../models/order.models';
import { StatsService } from '../../services/stats.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-restaurant-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink, AppShellComponent],
  template: `
    <app-shell>
      <main class="fe-page dash-page">
        <header class="dash-header">
          <h1>Tableau de bord</h1>
          <div class="dash-actions">
            <button type="button" class="fe-btn fe-btn-secondary" (click)="load()" [disabled]="isLoading()">Actualiser</button>
            <a class="fe-btn fe-btn-secondary" routerLink="/restaurateur/orders">Gérer les commandes</a>
          </div>
        </header>

        @if (errorMessage()) {
          <p class="fe-alert fe-alert-error" role="alert">{{ errorMessage() }}</p>
        } @else if (stats(); as s) {
          <section class="kpi-grid" aria-label="Indicateurs">
            <article class="kpi"><span class="kpi-label">Commandes</span><strong>{{ s.totalOrders }}</strong></article>
            <article class="kpi"><span class="kpi-label">En attente</span><strong>{{ s.pendingOrders }}</strong></article>
            <article class="kpi"><span class="kpi-label">Acceptées</span><strong>{{ s.acceptedOrders }}</strong></article>
            <article class="kpi"><span class="kpi-label">Chiffre d'affaires</span><strong>{{ s.revenue | number:'1.2-2' }} DT</strong></article>
          </section>
          <p class="fe-muted note">Le chiffre d'affaires compte uniquement les commandes livrées.</p>

          <section class="box" aria-label="Plats les plus commandés">
            <h2>Plats les plus commandés</h2>
            @if (!s.topDishes.length) {
              <p class="fe-muted">Aucune commande pour le moment.</p>
            } @else {
              <table>
                <thead><tr><th>#</th><th>Plat</th><th>Quantité commandée</th></tr></thead>
                <tbody>
                  @for (dish of s.topDishes; track dish.plat; let i = $index) {
                    <tr><td>{{ i + 1 }}</td><td>{{ dish.nom }}</td><td>{{ dish.quantite }}</td></tr>
                  }
                </tbody>
              </table>
            }
          </section>
        } @else {
          <p class="fe-muted" role="status">Chargement des statistiques…</p>
        }
      </main>
    </app-shell>
  `,
  styles: [`
    :host { display: block; }
    .dash-page { display: flex; flex-direction: column; gap: 20px; }
    .dash-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
    .dash-header h1 { margin: 0; }
    .dash-actions { display: flex; flex-wrap: wrap; gap: 12px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; }
    .kpi { display: flex; flex-direction: column; gap: 6px; padding: 20px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); }
    .kpi-label { color: var(--fe-on-surface-variant); font-size: 0.9rem; }
    .kpi strong { font-size: 1.8rem; }
    .note { margin: 0; font-size: 0.85rem; }
    .box { padding: 20px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); overflow-x: auto; }
    .box h2 { margin: 0 0 12px; font-size: 1.1rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid var(--fe-card-border); }
  `]
})
export class RestaurantDashboardComponent implements OnInit {
  private readonly statsService = inject(StatsService);

  readonly stats = signal<RestaurateurStats | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.statsService.getRestaurateurStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les statistiques');
        this.isLoading.set(false);
      }
    });
  }
}
