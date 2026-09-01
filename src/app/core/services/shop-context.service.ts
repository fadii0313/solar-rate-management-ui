import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShopContextService {
  private activeShopIdSubject = new BehaviorSubject<number | null>(null);
  private activeShopNameSubject = new BehaviorSubject<string | null>(null);

  public activeShopId$: Observable<number | null> = this.activeShopIdSubject.asObservable();
  public activeShopName$: Observable<string | null> = this.activeShopNameSubject.asObservable();

  constructor() {
    const savedId = localStorage.getItem('solar_active_shop_id');
    const savedName = localStorage.getItem('solar_active_shop_name');

    if (savedId && savedId !== 'null') {
      this.activeShopIdSubject.next(parseInt(savedId, 10));
    }
    if (savedName && savedName !== 'null') {
      this.activeShopNameSubject.next(savedName);
    }
  }

  public get currentShopId(): number | null {
    return this.activeShopIdSubject.value;
  }

  public get currentShopName(): string | null {
    return this.activeShopNameSubject.value;
  }

  setShop(shopId: number | null, shopName: string | null) {
    if (shopId === null) {
      localStorage.removeItem('solar_active_shop_id');
    } else {
      localStorage.setItem('solar_active_shop_id', shopId.toString());
    }

    if (shopName === null) {
      localStorage.removeItem('solar_active_shop_name');
    } else {
      localStorage.setItem('solar_active_shop_name', shopName);
    }

    this.activeShopIdSubject.next(shopId);
    this.activeShopNameSubject.next(shopName);
  }

  clear() {
    localStorage.removeItem('solar_active_shop_id');
    localStorage.removeItem('solar_active_shop_name');
    this.activeShopIdSubject.next(null);
    this.activeShopNameSubject.next(null);
  }
}
