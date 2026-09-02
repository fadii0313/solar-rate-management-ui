import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';
import { ShopContextService } from './core/services/shop-context.service';
import { environment } from '../environments/environment';

interface Shop {
  id: number;
  name: string;
}

interface RateNotification {
  id: number;
  userFullName: string;
  message: string;
  timestamp: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Solar Rate Management';
  showShopDropdown = false;
  showUserDropdown = false;
  showNotificationDropdown = false;
  isSidebarCollapsed = false;

  notifications: RateNotification[] = [];
  unreadCount = 0;
  private pollingTimer: any = null;

  constructor(
    private authService: AuthService,
    private shopContextService: ShopContextService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.loadNotifications();
      this.pollingTimer = setInterval(() => this.loadNotifications(), 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
  }

  loadNotifications(): void {
    if (!this.isLoggedIn()) return;
    this.http.get<RateNotification[]>(`${environment.apiUrl}/auditlogs/notifications`).subscribe({
      next: data => {
        this.notifications = data || [];
        this.unreadCount = this.notifications.length;
      },
      error: () => {}
    });
  }

  toggleNotificationDropdown(): void {
    this.showNotificationDropdown = !this.showNotificationDropdown;
    if (this.showNotificationDropdown) {
      this.showShopDropdown = false;
      this.showUserDropdown = false;
      this.unreadCount = 0; // Mark as viewed
    }
  }

  clearNotifications(): void {
    this.notifications = [];
    this.unreadCount = 0;
    this.showNotificationDropdown = false;
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  get currentUser() {
    const user = this.authService.currentUserValue;
    return {
      name: user ? `${user.firstName} ${user.lastName}` : 'Guest User',
      email: user?.email || '',
      role: user && user.roles.length > 0 ? user.roles[0] : 'Guest'
    };
  }

  get avatarInitials(): string {
    const user = this.authService.currentUserValue;
    if (!user) return 'GU';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || 'US';
  }

  get shops(): Shop[] {
    return this.authService.shops.map(s => ({
      id: s.shopId,
      name: s.shopName
    }));
  }

  get selectedShop() {
    return {
      id: this.shopContextService.currentShopId,
      name: this.shopContextService.currentShopName || 'Select Shop...'
    };
  }

  toggleShopDropdown() {
    this.showShopDropdown = !this.showShopDropdown;
    if (this.showShopDropdown) {
      this.showUserDropdown = false;
      this.showNotificationDropdown = false;
    }
  }

  selectShop(shop: Shop) {
    this.shopContextService.setShop(shop.id, shop.name);
    this.showShopDropdown = false;
    // Broadcast context changes globally
    window.dispatchEvent(new CustomEvent('solar-shop-context-changed', { detail: shop }));
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
    if (this.showUserDropdown) {
      this.showShopDropdown = false;
      this.showNotificationDropdown = false;
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.showUserDropdown = false;
    this.showNotificationDropdown = false;
    this.authService.logout().subscribe({
      next: () => {
        this.shopContextService.clear();
        localStorage.clear();
        sessionStorage.clear();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.shopContextService.clear();
        localStorage.clear();
        sessionStorage.clear();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
