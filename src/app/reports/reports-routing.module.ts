import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrintViewComponent } from './print-view/print-view.component';

const routes: Routes = [
  { path: '', redirectTo: 'print-view', pathMatch: 'full' },
  { path: 'print-view', component: PrintViewComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
