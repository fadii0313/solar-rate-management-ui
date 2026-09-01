import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'dashboard', canActivate: [authGuard], loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'shops', canActivate: [authGuard], loadChildren: () => import('./shops/shops.module').then(m => m.ShopsModule) },
  { path: 'categories', canActivate: [authGuard], loadChildren: () => import('./categories/categories.module').then(m => m.CategoriesModule) },
  { path: 'items', canActivate: [authGuard], loadChildren: () => import('./items/items.module').then(m => m.ItemsModule) },
  { path: 'rates', canActivate: [authGuard], loadChildren: () => import('./rates/rates.module').then(m => m.RatesModule) },
  { path: 'reports', canActivate: [authGuard], loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule) },
  { path: 'users', canActivate: [authGuard], loadChildren: () => import('./users/users.module').then(m => m.UsersModule) },
  { path: 'audit-logs', canActivate: [authGuard], loadChildren: () => import('./audit-logs/audit-logs.module').then(m => m.AuditLogsModule) },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
