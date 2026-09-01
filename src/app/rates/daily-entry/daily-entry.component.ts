import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ShopContextService } from '../../core/services/shop-context.service';
import { ExportService } from '../../core/services/export.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface DailyRateItem {
  itemId: number;
  itemCode: string;
  itemName: string;
  brand: string;
  model: string;
  unit: string;
  categoryName: string;
  rateId?: number;
  rate: number;
  yesterdayRate: number;
  remarks: string;
  isLocked: boolean;
}

@Component({
  selector: 'app-daily-entry',
  templateUrl: './daily-entry.component.html',
  styleUrl: './daily-entry.component.css'
})
export class DailyEntryComponent implements OnInit, OnDestroy {
  rates: DailyRateItem[] = [];
  selectedDate: string = new Date().toISOString().split('T')[0];
  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  activeShopId: number | null = null;
  activeShopName: string | null = null;

  // Copy Rates Modal State
  showCopyModal = false;
  copySourceDate: string = new Date(Date.now() - 86400000).toISOString().split('T')[0]; // yesterday by default
  overwriteCopy = false;
  copying = false;

  private subs = new Subscription();

  constructor(
    private http: HttpClient,
    private shopContextService: ShopContextService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.shopContextService.activeShopId$.subscribe(id => {
        this.activeShopId = id;
        this.loadRates();
      })
    );

    this.subs.add(
      this.shopContextService.activeShopName$.subscribe(name => {
        this.activeShopName = name;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onDateChange(): void {
    this.loadRates();
  }

  loadRates(): void {
    if (this.activeShopId === null) {
      this.rates = [];
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const url = `${environment.apiUrl}/rates/daily?date=${this.selectedDate}`;
    this.http.get<DailyRateItem[]>(url).subscribe({
      next: (data) => {
        this.rates = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load daily rates from the server.';
        this.rates = [];
        this.loading = false;
      }
    });
  }

  calculateDiff(item: DailyRateItem): { value: number; class: string; text: string } {
    if (!item.yesterdayRate || item.yesterdayRate === 0) {
      return { value: 0, class: 'diff-neutral', text: 'New Item / No Hist.' };
    }

    const diff = item.rate - item.yesterdayRate;
    const pct = (diff / item.yesterdayRate) * 100;

    if (diff > 0) {
      return { value: pct, class: 'diff-positive', text: `+${pct.toFixed(1)}%` };
    } else if (diff < 0) {
      return { value: pct, class: 'diff-negative', text: `${pct.toFixed(1)}%` };
    } else {
      return { value: 0, class: 'diff-neutral', text: '0.0% (Stable)' };
    }
  }

  saveRates(): void {
    if (this.activeShopId === null) return;

    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = this.rates.map(item => ({
      itemId: item.itemId,
      rate: item.rate,
      remarks: item.remarks || ''
    }));

    const url = `${environment.apiUrl}/rates/daily?date=${this.selectedDate}`;
    this.http.post<any>(url, payload).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Daily rates saved successfully!';
        this.saving = false;
        this.loadRates();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to save daily rates.';
        this.saving = false;
      }
    });
  }

  // Copy Previous Rates Modal Methods
  openCopyModal(): void {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - 1);
    this.copySourceDate = d.toISOString().split('T')[0];
    this.overwriteCopy = false;
    this.showCopyModal = true;
  }

  closeCopyModal(): void {
    this.showCopyModal = false;
  }

  submitCopyRates(): void {
    if (!this.copySourceDate) return;

    this.copying = true;
    const payload = {
      sourceDate: this.copySourceDate,
      targetDate: this.selectedDate,
      overwriteExisting: this.overwriteCopy
    };

    this.http.post<any>(`${environment.apiUrl}/rates/copy`, payload).subscribe({
      next: (res) => {
        this.copying = false;
        this.showCopyModal = false;
        this.successMessage = res.message || 'Rates copied successfully!';
        this.loadRates();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.copying = false;
        this.errorMessage = err.error?.message || err.error?.Message || 'Failed to copy rates.';
      }
    });
  }

  exportRatesToExcel(): void {
    if (!this.rates || !this.rates.length) return;
    const exportRows = this.rates.map(r => ({
      'Item Code': r.itemCode,
      'Item Name': r.itemName,
      'Category': r.categoryName,
      'Brand': r.brand,
      'Unit': r.unit,
      'Today Rate': r.rate,
      'Yesterday Rate': r.yesterdayRate,
      'Change %': this.calculateDiff(r).text,
      'Remarks': r.remarks
    }));
    this.exportService.exportToCsv(`Daily_Rates_${this.activeShopName}_${this.selectedDate}`, exportRows);
  }
}
