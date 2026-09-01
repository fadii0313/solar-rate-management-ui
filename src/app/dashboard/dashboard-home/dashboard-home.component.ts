import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface DashboardStats {
  categoriesCount: number;
  itemsCount: number;
  usersCount: number;
  shopsCount: number;
}

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent implements OnInit {
  stats: DashboardStats = {
    categoriesCount: 5,
    itemsCount: 4,
    usersCount: 1,
    shopsCount: 3
  };
  
  apiStatusMessage = 'Connecting to backend...';
  apiSuccess = false;

  templateItems = [
    { code: 'PAN-LONGI-550W', name: 'Longi 550W Hi-MO 5', category: 'Solar Panels', unit: 'W', rate: 45.20, status: 'Active', updated: 'Today' },
    { code: 'PAN-JINKO-545W', name: 'Jinko Tiger Pro 545W', category: 'Solar Panels', unit: 'W', rate: 44.80, status: 'Active', updated: 'Today' },
    { code: 'INV-GROWATT-10K', name: 'Growatt 10kW Three-Phase Hybrid', category: 'Inverters', unit: 'Unit', rate: 185000, status: 'Active', updated: 'Yesterday' },
    { code: 'INV-Solis-20K', name: 'Solis 20kW On-Grid', category: 'Inverters', unit: 'Unit', rate: 265000, status: 'Pending Update', updated: '3 days ago' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchDbStats();
  }

  fetchDbStats() {
    this.http.get<any>('http://localhost:5136/api/testdb/status').subscribe({
      next: (response) => {
        if (response && response.success) {
          this.stats.categoriesCount = response.data.categoriesCount;
          this.stats.itemsCount = response.data.itemsCount;
          this.stats.usersCount = response.data.usersCount;
          this.apiSuccess = true;
          this.apiStatusMessage = 'Connected to SQL Server LocalDB Database.';
        }
      },
      error: (err) => {
        console.warn('Backend API is offline or CORS is blocked. Using seed/mock fallback stats.', err);
        this.apiSuccess = false;
        this.apiStatusMessage = 'Backend service offline. Showing mock/fallback metrics.';
      }
    });
  }
}
