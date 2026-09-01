import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface UserRecord {
  id: number; fullName: string; username: string;
  email: string; mobile: string; isActive: boolean;
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
  showCreateModal = false;

  // New User Form Data
  newUser = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    roleId: 0,
    shopId: null as number | null
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
    this.loadRolesAndShops();
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
      next: r => { this.roles = r || []; if (this.roles.length) this.newUser.roleId = this.roles[0].id; },
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

  openModal(): void {
    this.resetForm();
    this.showCreateModal = true;
  }

  closeModal(): void {
    this.showCreateModal = false;
  }

  resetForm(): void {
    this.newUser = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      mobile: '',
      password: '',
      roleId: this.roles.length ? this.roles[0].id : 0,
      shopId: null
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitCreateUser(): void {
    if (!this.newUser.firstName || !this.newUser.lastName || !this.newUser.username || !this.newUser.email || !this.newUser.password) {
      this.errorMessage = 'Please fill in all required fields (First Name, Last Name, Username, Email, Password).';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.http.post(`${environment.apiUrl}/users`, this.newUser).subscribe({
      next: () => {
        this.saving = false;
        this.showCreateModal = false;
        this.successMessage = `User '${this.newUser.username}' created successfully!`;
        this.load();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: err => {
        this.saving = false;
        this.errorMessage = err.error?.Message || err.error?.message || 'Failed to create user.';
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
