import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  errorMessage = '';
  searchQuery = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadShops();
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
    };
    return colors[city] ?? '#a78bfa';
  }
}
