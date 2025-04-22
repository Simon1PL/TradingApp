import { Component, Input } from '@angular/core';
import { Trade } from '../models/tradeModels';
import { FormsModule } from '@angular/forms';
import { TransactionType } from '../models/tradeEnums';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { CompaniesInfoService } from '../services/companies-info.service';

@Component({
  selector: 'trades-table',
  imports: [FormsModule, TableModule, TagModule, CommonModule],
  templateUrl: './trades-table.component.html',
  styleUrl: './trades-table.component.scss'
})
export class TradesTableComponent {
  @Input() trades: Trade[] = [];
  @Input() isSubTable: boolean = false;

  constructor(public companiesInfoService: CompaniesInfoService) { }

  getTradeResultColor(trade: Trade): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (trade.transactionType) {
        case TransactionType.Buy:
        case TransactionType.Dividend:
        case TransactionType.FreeFundsInterest:
          return 'success';
        case TransactionType.Sell:
        case TransactionType.DividendTax:
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
