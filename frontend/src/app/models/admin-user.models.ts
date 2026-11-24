import { User, UserRole } from './auth.models';

export interface AdminUser extends User {
  createdAt: string;
}

export type AdminUserRoleFilter = UserRole | 'all';
export type AdminUserStatusFilter = 'all' | 'active' | 'inactive';

export interface AdminUsersQuery {
  search: string;
  role: AdminUserRoleFilter;
  status: AdminUserStatusFilter;
  page: number;
  limit: number;
}

export interface AdminUsersPage {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUserUpdateRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  role?: UserRole;
}

export interface AdminUserPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}
