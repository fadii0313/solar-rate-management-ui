import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Category {
  id: number; name: string; description: string;
  isActive: boolean; displayOrder: number; itemCount: number;
}

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  errorMessage = '';

  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<Category[]>('http://localhost:5136/api/categories').subscribe({
      next: d => { this.categories = d || []; this.loading = false; },
      error: err => { this.errorMessage = err.error?.message || 'Failed to load categories.'; this.loading = false; }
    });
  }

  categoryIcons: Record<string, string> = {
    'Solar Panels': '☀️',
    'Inverters': '⚡',
    'Batteries': '🔋',
    'Mounting Structures': '🏗️',
    'Accessories': '🔌',
  };
  getIcon(name: string): string { return this.categoryIcons[name] ?? '📦'; }
}
