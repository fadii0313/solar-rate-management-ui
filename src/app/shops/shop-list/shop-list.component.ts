import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Shop {
  id: number;
  name: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  city: string;
  address: string;
  isActive: boolean;
}

@Component({
  selector: 'app-shop-list',
  templateUrl: './shop-list.component.html',
  styleUrl: './shop-list.component.css'
})
export class ShopListComponent implements OnInit {
  shops: Shop[] = [];
  filtered: Shop[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';

  // Modal State
  showModal = false;
  isEditMode = false;
  editingShopId: number | null = null;
  shopForm = {
    name: '',
    ownerName: '',
    contactNumber: '',
    email: '',
    city: '',
    address: '',
    isActive: true
  };

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadShops();
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  loadShops(): void {
    this.loading = true;
    this.errorMessage = '';
    this.http.get<Shop[]>(`${environment.apiUrl}/shops`).subscribe({
      next: (data) => {
        this.shops = data || [];
        this.filtered = [...this.shops];
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load shops from server.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingShopId = null;
    this.shopForm = { name: '', ownerName: '', contactNumber: '', email: '', city: 'Islamabad', address: '', isActive: true };
    this.showModal = true;
  }

  openEditModal(shop: Shop): void {
    this.isEditMode = true;
    this.editingShopId = shop.id;
    this.shopForm = {
      name: shop.name,
      ownerName: shop.ownerName,
      contactNumber: shop.contactNumber,
      email: shop.email,
      city: shop.city,
      address: shop.address,
      isActive: shop.isActive
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveShop(): void {
    if (!this.shopForm.name || !this.shopForm.city) {
      alert('Shop Name and City are required.');
      return;
    }
    this.saving = true;
    if (this.isEditMode && this.editingShopId) {
      this.http.put(`${environment.apiUrl}/shops/${this.editingShopId}`, this.shopForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = 'Shop updated successfully!';
          this.loadShops();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.saving = false;
          alert(err.error?.message || 'Failed to update shop.');
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/shops`, this.shopForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = 'Shop created successfully!';
          this.loadShops();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.saving = false;
          alert(err.error?.message || 'Failed to create shop.');
        }
      });
    }
  }

  toggleShopStatus(shop: Shop): void {
    this.http.put<any>(`${environment.apiUrl}/shops/${shop.id}/toggle-status`, {}).subscribe({
      next: (res) => {
        shop.isActive = res.isActive;
        this.successMessage = res.message || 'Status updated!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => alert(err.error?.message || 'Failed to toggle status.')
    });
  }

  deleteShop(shop: Shop): void {
    if (!confirm(`Are you sure you want to delete shop '${shop.name}'?`)) return;
    this.http.delete(`${environment.apiUrl}/shops/${shop.id}`).subscribe({
      next: () => {
        this.successMessage = 'Shop deleted successfully!';
        this.loadShops();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => alert(err.error?.message || 'Failed to delete shop.')
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = q
      ? this.shops.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.ownerName.toLowerCase().includes(q)
        )
      : [...this.shops];
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  getCityColor(city: string): string {
    const colors: Record<string, string> = {
      'Islamabad': '#4facfe',
      'Lahore':    '#43e97b',
      'Karachi':   '#f7971e',
      'Multan':    '#a78bfa',
      'Faisalabad':'#f43f5e'
    };
    return colors[city] ?? '#a78bfa';
  }
}
