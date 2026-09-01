import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ShopContextService } from './core/services/shop-context.service';

interface Shop {
  id: number;
  name: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Solar Rate Management';
  showShopDropdown = false;
  showUserDropdown = false;
  isSidebarCollapsed = false;

  constructor(
    private authService: AuthService,
    private shopContextService: ShopContextService,
    private router: Router
  ) {}

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
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
    }
  }

  selectShop(shop: Shop) {
    this.shopContextService.setShop(shop.id, shop.name);
    this.showShopDropdown = false;
    // Broadcast context changes globally, triggering views to reload data
    window.dispatchEvent(new CustomEvent('solar-shop-context-changed', { detail: shop }));
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
    if (this.showUserDropdown) {
      this.showShopDropdown = false;
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.showUserDropdown = false;
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
