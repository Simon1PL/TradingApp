import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TradesService } from '../services/trades.service';
import { Trade, UITradeInstrument } from '../models/tradeModels';
import { TransactionType } from '../models/tradeEnums';
import { CompaniesInfoService } from '../services/companies-info.service';
import { TextareaModule } from 'primeng/textarea';
import { ImportXTBComponent } from '../import-xtb/import-xtb.component';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  standalone: true,
  selector: 'main-table',
  imports: [ImportXTBComponent, ButtonModule, TableModule, CommonModule, RatingModule, TagModule, FormsModule, TextareaModule, IconFieldModule, InputIconModule],
  templateUrl: './main-table.component.html',
  styleUrl: './main-table.component.scss'
})
export class MainTableComponent {
  constructor(private tradesService: TradesService, public companiesInfoService: CompaniesInfoService) {
    this.init();
  }

  async init() {
    await this.tradesService.loadTrades();
    this.groupedTrades = this.tradesService.getGroupedUITrades();
  }

  groupedTrades: UITradeInstrument[] = [];

  onGlobalFilter(event: Event, table: any) {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
  }

  clear(table: any) {
    table.clear();
  }

  getTradeResultColor(trade: Trade): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (trade.transactionType) {
        case TransactionType.Buy:
        case TransactionType.Dividend:
        case TransactionType.FreeFundsInterest:
          return 'success';
        case TransactionType.Sell:
        case TransactionType.DividendTax:
        case TransactionType.Swap:
        case TransactionType.Tax:
        case TransactionType.FreeFundsInterestTax:
        case TransactionType.Fee:
          return 'danger';
        case TransactionType.Withdrawal:
        case TransactionType.Deposit:
          return 'warn';
        default:
          return 'info';
    }
  }
}
