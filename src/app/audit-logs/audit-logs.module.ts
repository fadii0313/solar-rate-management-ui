import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuditLogsRoutingModule } from './audit-logs-routing.module';
import { AuditLogListComponent } from './audit-log-list/audit-log-list.component';


@NgModule({
  declarations: [
    AuditLogListComponent
  ],
  imports: [
    CommonModule,
    AuditLogsRoutingModule
  ]
})
export class AuditLogsModule { }
