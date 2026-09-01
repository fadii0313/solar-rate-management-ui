import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ItemsRoutingModule } from './items-routing.module';
import { ItemListComponent } from './item-list/item-list.component';

@NgModule({
  declarations: [
    ItemListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ItemsRoutingModule
  ]
})
export class ItemsModule { }
