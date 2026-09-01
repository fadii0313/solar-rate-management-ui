import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DailyEntryComponent } from './daily-entry/daily-entry.component';
import { HistoryComponent } from './history/history.component';
import { CompareComponent } from './compare/compare.component';

const routes: Routes = [
  { path: '', redirectTo: 'daily-entry', pathMatch: 'full' },
  { path: 'daily-entry', component: DailyEntryComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'compare', component: CompareComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RatesRoutingModule { }
