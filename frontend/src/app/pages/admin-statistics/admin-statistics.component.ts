import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminStats } from '../../models/order.models';
import { StatsService } from '../../services/stats.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [DecimalPipe, RouterLink, AppShellComponent],
  template: `
    <app-shell>
      <main class="fe-page stats-page">
        <header class="stats-header">
          <h1>Statistiques générales</h1>
          <div class="stats-actions">
            <button type="button" class="fe-btn fe-btn-secondary" (click)="load()" [disabled]="isLoading()">Actualiser</button>
            <a class="fe-btn fe-btn-secondary" routerLink="/admin">Retour</a>
          </div>
        </header>

        @if (errorMessage()) {
          <p class="fe-alert fe-alert-error" role="alert">{{ errorMessage() }}</p>
        } @else if (stats(); as s) {
          <section class="kpi-grid" aria-label="Indicateurs globaux">
            <article class="kpi"><span class="kpi-label">Clients</span><strong>{{ s.clients }}</strong></article>
            <article class="kpi"><span class="kpi-label">Restaurants</span><strong>{{ s.restaurants }}</strong></article>
            <article class="kpi"><span class="kpi-label">Commandes</span><strong>{{ s.orders }}</strong></article>
            <article class="kpi"><span class="kpi-label">Chiffre d'affaires global</span><strong>{{ s.revenue | number:'1.2-2' }} DT</strong></article>
          </section>
          <p class="fe-muted note">Le chiffre d'affaires compte uniquement les commandes livrées.</p>
        } @else {
          <p class="fe-muted" role="status">Chargement des statistiques…</p>
        }
      </main>
    </app-shell>
  `,
  styles: [`
    :host { display: block; }
    .stats-page { display: flex; flex-direction: column; gap: 20px; }
    .stats-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
    .stats-header h1 { margin: 0; }
    .stats-actions { display: flex; gap: 12px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .kpi { display: flex; flex-direction: column; gap: 6px; padding: 20px; border: 1px solid var(--fe-card-border); border-radius: 14px; background: var(--fe-surface-container-lowest); }
    .kpi-label { color: var(--fe-on-surface-variant); font-size: 0.9rem; }
    .kpi strong { font-size: 1.8rem; }
    .note { margin: 0; font-size: 0.85rem; }
  `]
})
export class AdminStatisticsComponent implements OnInit {
  private readonly statsService = inject(StatsService);

  readonly stats = signal<AdminStats | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.statsService.getAdminStats().subscribe({
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
