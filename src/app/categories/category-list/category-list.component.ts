import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Category {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  itemCount: number;
}

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  // Modal State
  showModal = false;
  isEditMode = false;
  editingCategoryId: number | null = null;
  categoryForm = {
    name: '',
    description: '',
    isActive: true,
    displayOrder: 0
  };

  categoryIcons: Record<string, string> = {
    'Solar Panels': '☀️',
    'Inverters': '⚡',
    'Batteries': '🔋',
    'Mounting Structures': '🏗️',
    'Accessories': '🔌',
  };

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
      next: d => { this.categories = d || []; this.loading = false; },
      error: err => { this.errorMessage = err.error?.message || 'Failed to load categories.'; this.loading = false; }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingCategoryId = null;
    this.categoryForm = { name: '', description: '', isActive: true, displayOrder: this.categories.length + 1 };
    this.showModal = true;
  }

  openEditModal(cat: Category): void {
    this.isEditMode = true;
    this.editingCategoryId = cat.id;
    this.categoryForm = {
      name: cat.name,
      description: cat.description,
      isActive: cat.isActive,
      displayOrder: cat.displayOrder
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCategory(): void {
    if (!this.categoryForm.name) {
      alert('Category Name is required.');
      return;
    }
    this.saving = true;
    if (this.isEditMode && this.editingCategoryId) {
      this.http.put(`${environment.apiUrl}/categories/${this.editingCategoryId}`, this.categoryForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = 'Category updated successfully!';
          this.load();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.saving = false;
          alert(err.error?.message || 'Failed to update category.');
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/categories`, this.categoryForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = 'Category created successfully!';
          this.load();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.saving = false;
          alert(err.error?.message || 'Failed to create category.');
        }
      });
    }
  }

  toggleCategoryStatus(cat: Category): void {
    this.http.put<any>(`${environment.apiUrl}/categories/${cat.id}/toggle-status`, {}).subscribe({
      next: (res) => {
        cat.isActive = res.isActive;
        this.successMessage = res.message || 'Status updated!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => alert(err.error?.message || 'Failed to toggle status.')
    });
  }

  deleteCategory(cat: Category): void {
    if (!confirm(`Are you sure you want to delete category '${cat.name}'?`)) return;
    this.http.delete(`${environment.apiUrl}/categories/${cat.id}`).subscribe({
      next: () => {
        this.successMessage = 'Category deleted successfully!';
        this.load();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => alert(err.error?.message || 'Failed to delete category.')
    });
  }

  getIcon(name: string): string { return this.categoryIcons[name] ?? '📦'; }
}
