import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ShopContextService } from '../../core/services/shop-context.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface HistoryRecord {
  id: number;
  rateDate: string;
  rate: number;
  remarks: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  brand: string;
  unit: string;
  categoryName: string;
}

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit, OnDestroy {
  records: HistoryRecord[] = [];
  filtered: HistoryRecord[] = [];
  loading = false;
  errorMessage = '';
  activeShopId: number | null = null;
  activeShopName: string | null = null;

  fromDate = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
  toDate   = new Date().toISOString().split('T')[0];
  selectedCategory = 'All';
  categories: string[] = ['All'];
  searchQuery = '';

  private subs = new Subscription();

  constructor(private http: HttpClient, private shopCtx: ShopContextService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.subs.add(this.shopCtx.activeShopId$.subscribe(id => {
      this.activeShopId = id;
      this.loadHistory();
    }));
    this.subs.add(this.shopCtx.activeShopName$.subscribe(n => this.activeShopName = n));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  loadCategories(): void {
    this.http.get<string[]>(`${environment.apiUrl}/rates/history/categories`).subscribe({
      next: cats => this.categories = ['All', ...cats],
      error: () => {}
    });
  }

  loadHistory(): void {
    if (!this.activeShopId) { this.records = []; this.filtered = []; return; }
    this.loading = true;
    this.errorMessage = '';
    const url = `${environment.apiUrl}/rates/history?fromDate=${this.fromDate}&toDate=${this.toDate}&category=${this.selectedCategory}`;
    this.http.get<HistoryRecord[]>(url).subscribe({
      next: data => {
        this.records = data || [];
        this.applySearch();
        this.loading = false;
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Failed to load rate history.';
        this.loading = false;
      }
    });
  }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = q
      ? this.records.filter(r =>
          r.itemName.toLowerCase().includes(q) ||
          r.itemCode.toLowerCase().includes(q) ||
          r.brand.toLowerCase().includes(q))
      : [...this.records];
  }

  onFilterChange(): void { this.loadHistory(); }
  onSearch(): void { this.applySearch(); }

  // Group records by date for display
  get groupedDates(): string[] {
    return [...new Set(this.filtered.map(r => r.rateDate.split('T')[0]))];
  }

  getRecordsForDate(date: string): HistoryRecord[] {
    return this.filtered.filter(r => r.rateDate.split('T')[0] === date);
  }
}
