import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ShopContextService } from '../../core/services/shop-context.service';
import { Subscription } from 'rxjs';

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

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.css'
})
export class ItemListComponent implements OnInit, OnDestroy {
  items: Item[] = [];
  filtered: Item[] = [];
  loading = false;
  errorMessage = '';
  searchQuery = '';
  selectedCategory = 'All';
  categories: string[] = [];
  activeShopId: number | null = null;
  activeShopName: string | null = null;

  private subs = new Subscription();

  constructor(
    private http: HttpClient,
    private shopContext: ShopContextService
  ) {}

  ngOnInit(): void {
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

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.http.get<Item[]>('http://localhost:5136/api/items').subscribe({
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
