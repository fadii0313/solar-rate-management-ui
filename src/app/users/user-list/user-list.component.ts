import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

interface UserRecord {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  mobile: string;
  isActive: boolean;
  createdDate: string;
  roles: string[];
  shops: { shopId: number; name: string; roleInShop: string }[];
}

interface RoleOption { id: number; name: string; description: string; }
interface ShopOption { id: number; name: string; city: string; }

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  users: UserRecord[] = [];
  filtered: UserRecord[] = [];
  roles: RoleOption[] = [];
  shops: ShopOption[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';

  // Modal State
  showModal = false;
  isEditMode = false;
  editingUserId: number | null = null;

  // User Form Data
  userForm = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    roleId: 0,
    shopId: null as number | null,
    isActive: true
  };

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.load();
    this.loadRolesAndShops();
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.http.get<UserRecord[]>(`${environment.apiUrl}/users`).subscribe({
      next: d => { this.users = d || []; this.applySearch(); this.loading = false; },
      error: err => { this.errorMessage = err.error?.message || 'Failed to load users.'; this.loading = false; }
    });
  }

  loadRolesAndShops(): void {
    this.http.get<RoleOption[]>(`${environment.apiUrl}/users/roles`).subscribe({
      next: r => { this.roles = r || []; if (this.roles.length && !this.userForm.roleId) this.userForm.roleId = this.roles[0].id; },
      error: () => {}
    });
    this.http.get<ShopOption[]>(`${environment.apiUrl}/shops`).subscribe({
      next: s => this.shops = s || [],
      error: () => {}
    });
  }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = q
      ? this.users.filter(u => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      : [...this.users];
  }

  onSearch(): void { this.applySearch(); }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.userForm = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      mobile: '',
      password: '',
      roleId: this.roles.length ? this.roles[0].id : 0,
      shopId: null,
      isActive: true
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(user: UserRecord): void {
    this.isEditMode = true;
    this.editingUserId = user.id;

    const names = user.fullName.split(' ');
    const firstName = user.firstName || names[0] || '';
    const lastName = user.lastName || names.slice(1).join(' ') || '';

    let roleId = 0;
    if (user.roles.length > 0) {
      const matchRole = this.roles.find(r => r.name === user.roles[0]);
      if (matchRole) roleId = matchRole.id;
    }

    let shopId: number | null = null;
    if (user.shops.length > 0) {
      shopId = user.shops[0].shopId;
    }

    this.userForm = {
      firstName: firstName,
      lastName: lastName,
      username: user.username,
      email: user.email,
      mobile: user.mobile || '',
      password: '',
      roleId: roleId || (this.roles.length ? this.roles[0].id : 0),
      shopId: shopId,
      isActive: user.isActive
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveUser(): void {
    if (!this.userForm.firstName || !this.userForm.lastName || !this.userForm.username || !this.userForm.email) {
      this.errorMessage = 'Please fill in all required fields (First Name, Last Name, Username, Email).';
      return;
    }

    if (!this.isEditMode && !this.userForm.password) {
      this.errorMessage = 'Password is required for new users.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    if (this.isEditMode && this.editingUserId) {
      this.http.put(`${environment.apiUrl}/users/${this.editingUserId}`, this.userForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = `User '${this.userForm.username}' updated successfully!`;
          this.load();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: err => {
          this.saving = false;
          this.errorMessage = err.error?.Message || err.error?.message || 'Failed to update user.';
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/users`, this.userForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = `User '${this.userForm.username}' created successfully!`;
          this.load();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: err => {
          this.saving = false;
          this.errorMessage = err.error?.Message || err.error?.message || 'Failed to create user.';
        }
      });
    }
  }

  toggleUserStatus(user: UserRecord): void {
    if (!this.isSuperAdmin()) return;
    this.http.put(`${environment.apiUrl}/users/${user.id}/toggle-status`, {}).subscribe({
      next: (res: any) => {
        user.isActive = !user.isActive;
        this.successMessage = res.message || 'User status updated.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Failed to toggle status.';
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  deleteUser(user: UserRecord): void {
    if (!this.isSuperAdmin()) return;
    if (!confirm(`Are you sure you want to delete user '${user.fullName}' (@${user.username})?`)) return;

    this.http.delete(`${environment.apiUrl}/users/${user.id}`).subscribe({
      next: () => {
        this.successMessage = `User '${user.username}' deleted successfully.`;
        this.load();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: err => {
        this.errorMessage = err.error?.Message || err.error?.message || 'Failed to delete user.';
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'SuperAdmin') return 'role-superadmin';
    if (role === 'ShopAdmin') return 'role-shopadmin';
    return 'role-shopuser';
  }
}
