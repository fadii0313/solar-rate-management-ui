import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ShopsRoutingModule } from './shops-routing.module';
import { ShopListComponent } from './shop-list/shop-list.component';

@NgModule({
  declarations: [
    ShopListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ShopsRoutingModule
  ]
})
export class ShopsModule { }
