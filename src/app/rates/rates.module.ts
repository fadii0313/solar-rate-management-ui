import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RatesRoutingModule } from './rates-routing.module';
import { DailyEntryComponent } from './daily-entry/daily-entry.component';
import { HistoryComponent } from './history/history.component';
import { CompareComponent } from './compare/compare.component';


@NgModule({
  declarations: [
    DailyEntryComponent,
    HistoryComponent,
    CompareComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RatesRoutingModule
  ]
})
export class RatesModule { }
