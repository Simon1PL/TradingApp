import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TradesService } from '../services/trades.service';
import { Trade, UITradeInstrument } from '../models/tradeModels';
import { CompaniesInfoService } from '../services/companies-info.service';
import { TextareaModule } from 'primeng/textarea';
import { ImportXTBComponent } from '../import-xtb/import-xtb.component';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TradesTableComponent } from '../trades-table/trades-table.component';
import { calculateClosedTrades, calculateStats } from '../helpers/tradeHelper';

@Component({
  standalone: true,
  selector: 'main-table',
  imports: [ImportXTBComponent, ButtonModule, TableModule, CommonModule, RatingModule, TagModule, FormsModule, TextareaModule, IconFieldModule, InputIconModule, TradesTableComponent],
  templateUrl: './main-table.component.html',
  styleUrl: './main-table.component.scss'
})
export class MainTableComponent {
  constructor(private tradesService: TradesService, public companiesInfoService: CompaniesInfoService) {
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

    this.groupedTrades = this.groupTrades(trades);
  }

  groupedTrades: UITradeInstrument[] = [];

  onGlobalFilter(event: Event, table: any) {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
  }

  clear(table: any) {
    table.clear();
  }

  groupTrades(trades: Trade[]): UITradeInstrument[] {
    const result: UITradeInstrument[] = [];
    const grouped = new Map<string, Trade[]>();
    for (const trade of trades as Trade[]) {
      if (!grouped.has(trade.symbol)) {
        grouped.set(trade.symbol, []);
      }

      grouped.get(trade.symbol)?.push(trade);
    }

    grouped.forEach((trades) => {
      calculateClosedTrades(trades);
    });

    grouped.forEach((trades, symbol) => {
      const instrument: UITradeInstrument = new UITradeInstrument(symbol, trades);
      instrument.stats = calculateStats(trades);
      instrument.name = ''; // TO DO, sth like this.companiesInfoService.getCompanyName(symbol)?
      result.push(instrument);
    });

    return result;
  }
}
