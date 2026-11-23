import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'restaurants',
    loadComponent: () => import('./pages/restaurants/restaurants.component').then((m) => m.RestaurantsComponent)
  },
  {
    path: 'restaurants/:id',
    loadComponent: () => import('./pages/restaurant-details/restaurant-details.component').then((m) => m.RestaurantDetailsComponent)
  },
  {
    path: 'admin/restaurants',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./pages/manage-restaurants/manage-restaurants.component').then((m) => m.ManageRestaurantsComponent)
  },
  {
    path: 'restaurateur/restaurants',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['restaurateur'] },
    loadComponent: () => import('./pages/manage-restaurants/manage-restaurants.component').then((m) => m.ManageRestaurantsComponent)
  },
  {
    path: 'restaurateur/restaurants/:id/menu',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['restaurateur'] },
    loadComponent: () => import('./pages/manage-dishes/manage-dishes.component').then((m) => m.ManageDishesComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent)
  },
  {
    path: 'edit-profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/edit-profile/edit-profile.component').then((m) => m.EditProfileComponent)
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/change-password/change-password.component').then((m) => m.ChangePasswordComponent)
  },
  {
    path: 'admin/users/:id/password',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./pages/admin-user-password/admin-user-password.component').then((m) => m.AdminUserPasswordComponent)
  },
  {
    path: 'admin/users/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./pages/admin-user-edit/admin-user-edit.component').then((m) => m.AdminUserEditComponent)
  },
  {
    path: 'admin/users/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./pages/admin-user-details/admin-user-details.component').then((m) => m.AdminUserDetailsComponent)
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./pages/admin-users/admin-users.component').then((m) => m.AdminUsersComponent)
  },
  {
    path: 'client',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['client'], title: 'Espace client', dashboardTitle: 'Client Dashboard' },
    loadComponent: () => import('./pages/role-space/role-space.component').then((m) => m.RoleSpaceComponent)
  },
  {
    path: 'restaurateur',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['restaurateur'], title: 'Espace restaurateur', dashboardTitle: 'Restaurateur Dashboard' },
    loadComponent: () => import('./pages/role-space/role-space.component').then((m) => m.RoleSpaceComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'], title: 'Espace administrateur', dashboardTitle: 'Admin Dashboard' },
    loadComponent: () => import('./pages/role-space/role-space.component').then((m) => m.RoleSpaceComponent)
  },
  { path: '**', redirectTo: 'login' }
];
