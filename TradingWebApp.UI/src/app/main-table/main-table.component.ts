import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TradesService } from '../services/trades.service';
import { Trade } from '../models/tradeModels';
import { InstrumentsService } from '../services/instruments.service';
import { TextareaModule } from 'primeng/textarea';
import { ImportXTBComponent } from '../import-xtb/import-xtb.component';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TradesTableComponent } from '../trades-table/trades-table.component';
import { ImportRevolutxComponent } from '../import-revolutx/import-revolutx.component';
import { ImportBybitComponent } from '../import-bybit/import-bybit.component';
import { TradeInstrument } from '../models/instrumentModels';

@Component({
  standalone: true,
  selector: 'main-table',
  imports: [ImportRevolutxComponent, ImportXTBComponent, ImportBybitComponent, ButtonModule, TableModule, CommonModule, RatingModule, TagModule, FormsModule, TextareaModule, IconFieldModule, InputIconModule, TradesTableComponent],
  templateUrl: './main-table.component.html',
  styleUrl: './main-table.component.scss'
})
export class MainTableComponent {
  instruments: TradeInstrument[] = [];
  
  constructor(private tradesService: TradesService, private instrumentsService: InstrumentsService) {
    this.init();
  }

  async init() {
    const trades = this.tradesService.getTrades();
    trades.sort((a, b) => {
      if (a.date && b.date) {
        return a.date.getTime() - b.date.getTime();
      }
      return 0;
    });

    this.instruments = this.instrumentsService.getInstruments();
  }

  async clearCache() {
    this.tradesService.clearCache();
    await this.init();
  }

  onGlobalFilter(event: Event, table: any) {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
  }

  clear(table: any) {
    table.clear();
  }
}
