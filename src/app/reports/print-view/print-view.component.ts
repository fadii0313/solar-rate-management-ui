import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ShopContextService } from '../../core/services/shop-context.service';
import { Subscription } from 'rxjs';

interface PrintItem {
  itemCode: string; itemName: string; brand: string;
  unit: string; categoryName: string;
  rate: number; remarks: string;
}

@Component({
  selector: 'app-print-view',
  templateUrl: './print-view.component.html',
  styleUrl: './print-view.component.css'
})
export class PrintViewComponent implements OnInit, OnDestroy {
  items: PrintItem[] = [];
  loading = false;
  errorMessage = '';
  selectedDate = new Date().toISOString().split('T')[0];
  activeShopId: number | null = null;
  activeShopName: string | null = null;
  today = new Date();

  private subs = new Subscription();

  constructor(private http: HttpClient, private shopCtx: ShopContextService) {}

  ngOnInit(): void {
    this.subs.add(this.shopCtx.activeShopId$.subscribe(id => { this.activeShopId = id; this.loadRates(); }));
    this.subs.add(this.shopCtx.activeShopName$.subscribe(n => this.activeShopName = n));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  loadRates(): void {
    if (!this.activeShopId) { this.items = []; return; }
    this.loading = true;
    this.errorMessage = '';
    this.http.get<any[]>(`http://localhost:5136/api/rates/daily?date=${this.selectedDate}`).subscribe({
      next: data => {
        this.items = (data || []).filter(d => d.rate > 0).map(d => ({
          itemCode: d.itemCode, itemName: d.itemName, brand: d.brand,
          unit: d.unit, categoryName: d.categoryName, rate: d.rate, remarks: d.remarks
        }));
        this.loading = false;
      },
      error: err => { this.errorMessage = err.error?.message || 'Failed to load rates.'; this.loading = false; }
    });
  }

  onDateChange(): void { this.loadRates(); }
  printPage(): void { window.print(); }

  get categories(): string[] {
    return [...new Set(this.items.map(i => i.categoryName))];
  }
  getItemsByCategory(cat: string): PrintItem[] {
    return this.items.filter(i => i.categoryName === cat);
  }
}
