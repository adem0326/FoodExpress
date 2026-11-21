import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FlashMessageService } from '../../services/flash-message.service';

@Component({
  selector: 'app-role-space',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="role-space">
      <div class="dashboard-shell">
        <header class="dashboard-header">
          <div>
            <p class="eyebrow">FoodExpress</p>
            <h1>Bienvenue, {{ currentUser()?.prenom }} {{ currentUser()?.nom }}</h1>
            <p class="welcome-copy">{{ title }} · Gérez les informations de votre compte.</p>
          </div>
          <button class="logout-button" type="button" (click)="logout()">Se déconnecter</button>
        </header>

        @if (flashMessage.message()) {
          <p class="success-notice" role="status">{{ flashMessage.message() }}</p>
        }

        <section class="dashboard-section" aria-labelledby="dashboard-title">
          <h2 id="dashboard-title">{{ dashboardTitle }}</h2>
          <nav class="dashboard-actions" aria-label="Gestion du compte">
            <a class="dashboard-action" routerLink="/profile">
              <span>Mon profil</span>
              <small>Consulter vos informations</small>
            </a>
            <a class="dashboard-action" routerLink="/edit-profile">
              <span>Modifier le profil</span>
              <small>Mettre à jour votre nom et téléphone</small>
            </a>
            <a class="dashboard-action" routerLink="/change-password">
              <span>Changer le mot de passe</span>
              <small>Sécuriser votre compte</small>
            </a>
          </nav>
        </section>
        @if (currentUser()?.role === 'admin') {
          <section class="dashboard-section user-management-section" aria-labelledby="user-management-title">
            <h2 id="user-management-title">Gestion des utilisateurs</h2>
            <p>Consultez et gérez les comptes de la plateforme depuis l'espace d'administration.</p>
            <a class="dashboard-action user-management-link" routerLink="/admin/users">
              <span>Gérer les utilisateurs</span>
              <small>Ouvrir la liste des comptes</small>
            </a>
          </section>
        }
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; }
    .role-space { min-height: 100dvh; padding: clamp(24px, 6vw, 72px); background: #FFF8F6; color: #42281C; }
    .dashboard-shell { width: min(1000px, 100%); margin: 0 auto; }
    .dashboard-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 36px; }
    .eyebrow { margin: 0 0 12px; color: #A35233; font-weight: 700; letter-spacing: .04em; }
    h1, h2 { font-family: Epilogue, sans-serif; }
    h1 { margin: 0; font-size: clamp(28px, 5vw, 42px); }
    .welcome-copy { color: #7b5d50; line-height: 1.6; }
    .success-notice { margin: 0 0 24px; padding: 14px 18px; border: 1px solid #b9dfc0; border-radius: 12px; color: #246b36; background: #eef8ef; }
    .dashboard-section { padding: clamp(24px, 4vw, 36px); border: 1px solid #ead8ce; border-radius: 20px; background: #fff; box-shadow: 0 16px 48px rgba(66,40,28,.08); }
    .user-management-section { margin-top: 24px; }
    h2 { margin: 0 0 24px; font-size: 24px; }
    .user-management-section p { color: #7b5d50; line-height: 1.6; }
    .dashboard-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
    .user-management-link { width: min(320px, 100%); min-height: 88px; }
    .dashboard-action { display: flex; min-height: 112px; flex-direction: column; justify-content: center; gap: 8px; padding: 20px; border: 1px solid #ead8ce; border-radius: 14px; color: #42281C; background: #fffaf7; text-decoration: none; transition: border-color .2s, transform .2s; }
    .dashboard-action:hover { transform: translateY(-2px); border-color: #D6834F; }
    .dashboard-action span { color: #A35233; font-weight: 700; }
    .dashboard-action small { color: #7b5d50; line-height: 1.5; }
    .logout-button { flex: 0 0 auto; margin-top: 4px; padding: 12px 20px; border: 0; border-radius: 12px; color: #fff; background: #D6834F; font-weight: 600; cursor: pointer; }
    .logout-button:hover { background: #A35233; }
    @media (max-width: 640px) {
      .dashboard-header { flex-direction: column; }
      .logout-button { align-self: stretch; }
    }
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
