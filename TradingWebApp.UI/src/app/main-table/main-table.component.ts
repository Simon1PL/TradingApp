import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TradesService } from '../services/trades.service';
import { Trade } from '../models/tradeModels';
import { TransactionType } from '../models/tradeEnums';
import { CompaniesInfoService } from '../services/companies-info.service';
import { TextareaModule } from 'primeng/textarea';
import { ImportXTBComponent } from '../import-xtb/import-xtb.component';

@Component({
  standalone: true,
  selector: 'main-table',
  imports: [ImportXTBComponent, ButtonModule, TableModule, CommonModule, RatingModule, TagModule, FormsModule, TextareaModule],
  templateUrl: './main-table.component.html',
  styleUrl: './main-table.component.scss'
})
export class MainTableComponent {
  constructor(private tradesService: TradesService, public companiesInfoService: CompaniesInfoService) {
    this.init();
  }

  async init() {
    await this.tradesService.loadTrades();
    this.trades = this.tradesService.getTrades();
  }

  trades: Trade[] = [];

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
          return 'danger';
        case TransactionType.Withdrawal:
        case TransactionType.Deposit:
          return 'warn';
        default:
          return 'info';
    }
  }
}
