import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FlashMessageService } from '../../services/flash-message.service';
import { AppShellComponent } from '../../shared/app-shell.component';

@Component({
  selector: 'app-role-space',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  template: `
    <app-shell>
      <main class="role-space">
        <section class="fe-hero">
          <div class="fe-hero-glow fe-hero-glow-a" aria-hidden="true"></div>
          <div class="fe-hero-glow fe-hero-glow-b" aria-hidden="true"></div>
          <div class="fe-container fe-hero-inner">
            <div class="fe-hero-copy">
              <span class="fe-badge fe-badge-warm">
                <span class="material-symbols-outlined" aria-hidden="true" style="font-size: 15px;">verified</span>
                {{ title }}
              </span>
              <h1 class="fe-headline-lg">Bienvenue, {{ currentUser()?.prenom }} {{ currentUser()?.nom }}</h1>
              <p class="fe-body-lg fe-muted">{{ title }} — Gérez les informations de votre compte.</p>
              <div class="fe-trust-list" aria-hidden="true">
                <span><span class="material-symbols-outlined">agriculture</span> Producteurs &amp; artisans locaux</span>
                <span><span class="material-symbols-outlined">pedal_bike</span> Livraison douce</span>
                <span><span class="material-symbols-outlined">verified</span> Fraîcheur du jour</span>
              </div>
            </div>
            <button class="fe-btn fe-btn-secondary" type="button" (click)="logout()">
              <span class="material-symbols-outlined" aria-hidden="true">logout</span>
              Se déconnecter
            </button>
          </div>
        </section>

        <div class="fe-container fe-page">
          @if (flashMessage.message()) {
            <p class="fe-alert fe-alert-success" role="status">{{ flashMessage.message() }}</p>
          }

          <section class="dashboard-section" aria-labelledby="dashboard-title">
            <div class="fe-section-heading">
              <div>
                <span class="fe-section-dot" aria-hidden="true"></span>
                <h2 id="dashboard-title" class="fe-headline-md">{{ dashboardTitle }}</h2>
              </div>
              <span class="fe-badge">Gestion du compte</span>
            </div>

            <nav class="fe-bento-grid" aria-label="Gestion du compte">
              <a class="fe-action-card" routerLink="/profile">
                <div class="fe-action-card-top">
                  <span class="fe-icon-tile"><span class="material-symbols-outlined" aria-hidden="true">badge</span></span>
                  <span class="material-symbols-outlined fe-action-arrow" aria-hidden="true">arrow_forward</span>
                </div>
                <div>
                  <h3>Mon profil</h3>
                  <p>Consulter vos informations</p>
                </div>
                <span class="fe-action-card-footer">Afficher la fiche</span>
              </a>

              <a class="fe-action-card" routerLink="/edit-profile">
                <div class="fe-action-card-top">
                  <span class="fe-icon-tile"><span class="material-symbols-outlined" aria-hidden="true">edit_note</span></span>
                  <span class="material-symbols-outlined fe-action-arrow" aria-hidden="true">arrow_forward</span>
                </div>
                <div>
                  <h3>Modifier le profil</h3>
                  <p>Mettre à jour votre nom et téléphone</p>
                </div>
                <span class="fe-action-card-footer">Éditer les informations</span>
              </a>

              <a class="fe-action-card" routerLink="/change-password">
                <div class="fe-action-card-top">
                  <span class="fe-icon-tile"><span class="material-symbols-outlined" aria-hidden="true">lock_reset</span></span>
                  <span class="material-symbols-outlined fe-action-arrow" aria-hidden="true">arrow_forward</span>
                </div>
                <div>
                  <h3>Changer le mot de passe</h3>
                  <p>Sécuriser votre compte</p>
                </div>
                <span class="fe-action-card-footer">Gérer la sécurité</span>
              </a>
            </nav>
          </section>

          @if (currentUser()?.role === 'admin') {
            <section class="dashboard-section user-management-section" aria-labelledby="user-management-title">
              <div class="fe-section-heading">
                <div>
                  <span class="fe-section-dot" aria-hidden="true"></span>
                  <h2 id="user-management-title" class="fe-headline-md">Gestion des utilisateurs</h2>
                </div>
              </div>
              <p class="fe-body-md fe-muted">Consultez et gérez les comptes de la plateforme depuis l'espace d'administration.</p>
              <nav class="fe-bento-grid" aria-label="Gestion des utilisateurs">
                <a class="fe-action-card" routerLink="/admin/users">
                  <div class="fe-action-card-top">
                    <span class="fe-icon-tile"><span class="material-symbols-outlined" aria-hidden="true">admin_panel_settings</span></span>
                    <span class="material-symbols-outlined fe-action-arrow" aria-hidden="true">arrow_forward</span>
                  </div>
                  <div>
                    <h3>Gérer les utilisateurs</h3>
                    <p>Ouvrir la liste des comptes</p>
                  </div>
                  <span class="fe-action-card-footer">Ouvrir l'administration</span>
                </a>
                <a class="fe-action-card" routerLink="/admin/restaurants">
                  <div class="fe-action-card-top">
                    <span class="fe-icon-tile"><span class="material-symbols-outlined" aria-hidden="true">restaurant</span></span>
                    <span class="material-symbols-outlined fe-action-arrow" aria-hidden="true">arrow_forward</span>
                  </div>
                  <div>
                    <h3>Gérer les restaurants</h3>
                    <p>Valider, suspendre et modifier les établissements</p>
                  </div>
                  <span class="fe-action-card-footer">Ouvrir la gestion</span>
                </a>
                <a class="fe-action-card" routerLink="/admin/statistics">
                  <div class="fe-action-card-top">
                    <span class="fe-icon-tile"><span class="material-symbols-outlined" aria-hidden="true">bar_chart</span></span>
                    <span class="material-symbols-outlined fe-action-arrow" aria-hidden="true">arrow_forward</span>
                  </div>
                  <div>
                    <h3>Statistiques</h3>
                    <p>Clients, restaurants, commandes et chiffre d'affaires</p>
                  </div>
                  <span class="fe-action-card-footer">Voir les statistiques</span>
                </a>
              </nav>
            </section>
          }
          @if (currentUser()?.role === 'restaurateur') {
            <section class="dashboard-section user-management-section" aria-labelledby="restaurant-management-title">
              <div class="fe-section-heading">
                <div>
                  <span class="fe-section-dot" aria-hidden="true"></span>
                  <h2 id="restaurant-management-title" class="fe-headline-md">Gestion des restaurants</h2>
                </div>
              </div>
              <p class="fe-body-md fe-muted">Gérez uniquement les établissements dont vous êtes le propriétaire.</p>
              <nav class="fe-bento-grid" aria-label="Gestion des restaurants">
                <a class="fe-action-card" routerLink="/restaurateur/restaurants">
                  <div class="fe-action-card-top">
                    <span class="fe-icon-tile"><span class="material-symbols-outlined" aria-hidden="true">storefront</span></span>
                    <span class="material-symbols-outlined fe-action-arrow" aria-hidden="true">arrow_forward</span>
                  </div>
                  <div>
                    <h3>Mes restaurants</h3>
                    <p>Ajouter, modifier ou supprimer vos établissements</p>
                  </div>
                  <span class="fe-action-card-footer">Ouvrir la gestion</span>
                </a>
                <a class="fe-action-card" routerLink="/restaurateur/dashboard">
                  <div class="fe-action-card-top">
                    <span class="fe-icon-tile"><span class="material-symbols-outlined" aria-hidden="true">monitoring</span></span>
                    <span class="material-symbols-outlined fe-action-arrow" aria-hidden="true">arrow_forward</span>
                  </div>
                  <div>
                    <h3>Tableau de bord</h3>
                    <p>Statistiques et plats les plus commandés</p>
                  </div>
                  <span class="fe-action-card-footer">Voir les indicateurs</span>
                </a>
                <a class="fe-action-card" routerLink="/restaurateur/orders">
                  <div class="fe-action-card-top">
                    <span class="fe-icon-tile"><span class="material-symbols-outlined" aria-hidden="true">receipt_long</span></span>
                    <span class="material-symbols-outlined fe-action-arrow" aria-hidden="true">arrow_forward</span>
                  </div>
                  <div>
                    <h3>Commandes reçues</h3>
                    <p>Accepter, refuser et suivre les commandes</p>
                  </div>
                  <span class="fe-action-card-footer">Traiter les commandes</span>
                </a>
              </nav>
            </section>
          }
        </div>
      </main>
    </app-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; }
    .dashboard-section {
      padding: clamp(24px, 4vw, 36px);
      border: 1px solid var(--fe-card-border);
      border-radius: var(--fe-radius-lg);
      background: var(--fe-surface-container-lowest);
      box-shadow: var(--fe-shadow-card);
    }
    .user-management-section p { margin: 0 0 var(--fe-space-lg); }
  `]
})
export class RoleSpaceComponent {
  readonly auth = inject(AuthService);
  readonly flashMessage = inject(FlashMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly title = this.route.snapshot.data['title'] as string;
  readonly dashboardTitle = this.route.snapshot.data['dashboardTitle'] as string;
  readonly currentUser = this.auth.currentUser;

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
