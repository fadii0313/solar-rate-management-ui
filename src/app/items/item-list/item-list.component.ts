import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ShopContextService } from '../../core/services/shop-context.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Item {
  id: number;
  itemCode: string;
  itemName: string;
  brand: string;
  model: string;
  unit: string;
  description: string;
  categoryId: number;
  categoryName: string;
  shopId: number | null;
  isActive: boolean;
}

interface CategoryOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.css'
})
export class ItemListComponent implements OnInit, OnDestroy {
  items: Item[] = [];
  filtered: Item[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';
  selectedCategory = 'All';
  categories: string[] = [];
  categoryOptions: CategoryOption[] = [];
  activeShopId: number | null = null;
  activeShopName: string | null = null;

  // Modal State
  showModal = false;
  isEditMode = false;
  editingItemId: number | null = null;
  itemForm = {
    itemCode: '',
    itemName: '',
    brand: '',
    model: '',
    unit: 'Watt',
    description: '',
    categoryId: 1,
    isActive: true
  };

  private subs = new Subscription();

  constructor(
    private http: HttpClient,
    private shopContext: ShopContextService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCategoriesOptions();
    this.subs.add(
      this.shopContext.activeShopId$.subscribe(id => {
        this.activeShopId = id;
        this.loadItems();
      })
    );
    this.subs.add(
      this.shopContext.activeShopName$.subscribe(n => this.activeShopName = n)
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  loadCategoriesOptions(): void {
    this.http.get<any[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (data) => {
        this.categoryOptions = (data || []).map(c => ({ id: c.id, name: c.name }));
        if (this.categoryOptions.length > 0) {
          this.itemForm.categoryId = this.categoryOptions[0].id;
        }
      }
    });
  }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.http.get<Item[]>(`${environment.apiUrl}/items`).subscribe({
      next: (data) => {
        this.items = data || [];
        this.categories = ['All', ...new Set(this.items.map(i => i.categoryName))];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load items.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingItemId = null;
    this.itemForm = {
      itemCode: `SOL-${Math.floor(100 + Math.random() * 900)}`,
      itemName: '',
      brand: 'Longi',
      model: '',
      unit: 'Watt',
      description: '',
      categoryId: this.categoryOptions[0]?.id || 1,
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(item: Item): void {
    this.isEditMode = true;
    this.editingItemId = item.id;
    this.itemForm = {
      itemCode: item.itemCode,
      itemName: item.itemName,
      brand: item.brand,
      model: item.model,
      unit: item.unit,
      description: item.description,
      categoryId: item.categoryId,
      isActive: item.isActive
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveItem(): void {
    if (!this.itemForm.itemCode || !this.itemForm.itemName) {
      alert('Item Code and Item Name are required.');
      return;
    }
    this.saving = true;
    if (this.isEditMode && this.editingItemId) {
      this.http.put(`${environment.apiUrl}/items/${this.editingItemId}`, this.itemForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = 'Solar item updated successfully!';
          this.loadItems();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.saving = false;
          alert(err.error?.message || 'Failed to update item.');
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/items`, this.itemForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = 'Solar item created successfully!';
          this.loadItems();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.saving = false;
          alert(err.error?.message || 'Failed to create item.');
        }
      });
    }
  }

  toggleItemStatus(item: Item): void {
    this.http.put<any>(`${environment.apiUrl}/items/${item.id}/toggle-status`, {}).subscribe({
      next: (res) => {
        item.isActive = res.isActive;
        this.successMessage = res.message || 'Status updated!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => alert(err.error?.message || 'Failed to toggle status.')
    });
  }

  deleteItem(item: Item): void {
    if (!confirm(`Are you sure you want to delete item '${item.itemName}' (${item.itemCode})?`)) return;
    this.http.delete(`${environment.apiUrl}/items/${item.id}`).subscribe({
      next: () => {
        this.successMessage = 'Item deleted successfully!';
        this.loadItems();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => alert(err.error?.message || 'Failed to delete item.')
    });
  }

  onSearch(): void { this.applyFilters(); }
  onCategoryChange(cat: string): void { this.selectedCategory = cat; this.applyFilters(); }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.items.filter(i => {
      const matchCat = this.selectedCategory === 'All' || i.categoryName === this.selectedCategory;
      const matchSearch = !q ||
        i.itemName.toLowerCase().includes(q) ||
        i.itemCode.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }

  isGlobal(item: Item): boolean { return item.shopId === null; }
}
