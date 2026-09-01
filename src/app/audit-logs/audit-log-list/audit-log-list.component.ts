import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface AuditLog {
  id: number;
  username: string;
  userFullName: string;
  action: string;
  module: string;
  newValue: string;
  timestamp: string;
  ipAddress: string;
}

@Component({
  selector: 'app-audit-log-list',
  templateUrl: './audit-log-list.component.html',
  styleUrl: './audit-log-list.component.css'
})
export class AuditLogListComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = false;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<AuditLog[]>('http://localhost:5136/api/auditlogs').subscribe({
      next: (data) => {
        this.logs = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load system audit logs.';
        this.loading = false;
      }
    });
  }
}
