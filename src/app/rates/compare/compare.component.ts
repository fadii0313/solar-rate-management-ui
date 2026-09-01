import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../../core/services/export.service';
import { environment } from '../../../environments/environment';

interface ShopRef { id: number; name: string; }
interface ItemCompare {
  id: number; itemCode: string; itemName: string;
  brand: string; unit: string; categoryName: string;
  shopRates: { shopId: number; shopName: string; rate: number | null }[];
}
interface CompareResponse {
  date: string;
  shops: ShopRef[];
  items: ItemCompare[];
}

@Component({
  selector: 'app-compare',
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.css'
})
export class CompareComponent implements OnInit {
  data: CompareResponse | null = null;
  loading = false;
  errorMessage = '';
  selectedDate = new Date().toISOString().split('T')[0];

  constructor(
    private http: HttpClient,
    private exportService: ExportService
  ) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.http.get<CompareResponse>(`${environment.apiUrl}/rates/compare?date=${this.selectedDate}`).subscribe({
      next: d => { this.data = d; this.loading = false; },
      error: err => { this.errorMessage = err.error?.message || 'Failed to load comparison data.'; this.loading = false; }
    });
  }

  lowestRate(item: ItemCompare): number | null {
    const rates = item.shopRates.map(r => r.rate).filter((r): r is number => r !== null);
    return rates.length ? Math.min(...rates) : null;
  }

  isLowest(rate: number | null, item: ItemCompare): boolean {
    if (rate === null) return false;
    return rate === this.lowestRate(item);
  }

  diffPct(rate: number | null, item: ItemCompare): string {
    if (rate === null) return '—';
    const min = this.lowestRate(item);
    if (min === null || min === 0) return '—';
    if (rate === min) return 'Lowest';
    const pct = ((rate - min) / min * 100).toFixed(1);
    return `+${pct}%`;
  }

  exportCompareToExcel(): void {
    if (!this.data || !this.data.items.length) return;
    const exportRows = this.data.items.map(item => {
      const row: any = {
        'Category': item.categoryName,
        'Item Code': item.itemCode,
        'Item Name': item.itemName,
        'Brand': item.brand,
        'Unit': item.unit,
        'Lowest Rate (PKR)': this.lowestRate(item) ?? '—'
      };
      this.data?.shops.forEach(s => {
        const sr = item.shopRates.find(r => r.shopId === s.id);
        row[s.name] = sr?.rate ? `Rs. ${sr.rate}` : 'N/A';
      });
      return row;
    });
    this.exportService.exportToCsv(`MultiShop_Rate_Comparison_${this.selectedDate}`, exportRows);
  }
}
