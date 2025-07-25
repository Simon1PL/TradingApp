import { Component } from '@angular/core';
import { Trade } from '../models/tradeModels';
import { TradesService } from '../services/trades.service';
import * as XLSX from 'xlsx';
import { convertDataToTrades, NonHeaderField, TradeFieldsMappings } from '../helpers/dataConverter';
import { TransactionType } from '../models/tradeEnums';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { excelDateToJSDate } from '../helpers/excelHelper';
import BigNumber from "bignumber.js";

@Component({
  standalone: true,
  selector: 'import-bybit',
  imports: [CommonModule, ButtonModule],
  templateUrl: './import-bybit.component.html',
  styleUrl: './import-bybit.component.scss'
})
export class ImportBybitComponent {
  trades: Trade[] = [];
  error: string = '';

  constructor(private tradeService: TradesService) { }

  onFileChange(event: Event): void {
    for (var file of (event.target as HTMLInputElement).files ?? []) {
      if (file.name.startsWith("Bybit_unifiedAccount_spotTradeHistory")) {

      }
      else if (file.name.startsWith("Bybit_unifiedAccount_uSDTPerpetualTradeHistory")) {
        
      }
      else if (file.name.startsWith("Bybit_tradingTools_copyTradingTrades")) {
        
      }
      else if (file.name.startsWith("Bybit_AssetChangeDetails_uta")) {
        this.readAndProceedXLSXFile(file, (x) => this.convertUnifiedTradingAccountNonTradeTransactions(x));
      }
    }
  }

  readAndProceedXLSXFile(file: File, proceedFunction: (workbook: XLSX.WorkBook) => void) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const binaryString = e.target.result;
      const workbook = XLSX.read(binaryString, { type: 'binary' });
      proceedFunction(workbook);

      let balance = BigNumber(0);
      this.trades.forEach(trade => {
        balance = balance.plus(trade.originalValue ?? 0);
      });
      console.log('Imported trades balance is', balance.toFixed(2));
      // show window with imported trades to accept it

      this.tradeService.addTrades(this.trades.filter(trade => trade.originalDate));
    };
    reader.readAsBinaryString(file);
  }

  private convertUnifiedTradingAccountNonTradeTransactions(workbook: XLSX.WorkBook): void {
    const xtbHeaders = ['Time(UTC)', 'Currency', 'Quantity'];
    let trades: Trade[] = [];

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const openPositionsMappings: TradeFieldsMappings = {
      symbol: (x) => x['Currency'],
      originalTransactionType: (x) => x['Type'],
      originalDate: (x) => x['Time(UTC)'],
      date: (x) => excelDateToJSDate(x['Time(UTC)']),
      price: (x) => BigNumber(1),
      brokerAccount: (x) => x['Account'], // TO DO
      symbol2: (x) => x['Currency'],
      originalValue: (x) => BigNumber(x["Cash Flow"]),
      amount: (x) => BigNumber(x["Cash Flow"]),
      fee: (x) => BigNumber(x["Fee Paid"]),
      wasDone: (x) => true,
      broker: (x) => 'Bybit',
      transactionType: (originalTransactionType) => {
        return this.convertTransactionTypeBybit(originalTransactionType);
      },
      skip: (x) => x['Type'] === 'SETTLEMENT' || x['Type'] === 'TRADE',
    };

    trades.push(...convertDataToTrades(rows, xtbHeaders, [], openPositionsMappings));
    this.trades.push(...trades);
  }

  private convertUnifiedTradingAccountSpotTransactions(workbook: XLSX.WorkBook): void {
    const xtbHeaders = ['Comment', 'Symbol', 'Type'];
    const xtbNonHeaderFields = [
      new NonHeaderField('Account'),
      new NonHeaderField('Currency'),
      new NonHeaderField('Balance'),
    ];
    const openPositionSheet = 'OPEN POSITION';
    let tradesFromOpenPositions: Trade[] = [];

    for (const sheetName of workbook.SheetNames) {
      if (sheetName.startsWith(openPositionSheet)) {
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const openPositionsMappings: TradeFieldsMappings = {
          originalTransactionId: (x) => x['Position'],
          symbol: (x) => x['Symbol'],
          originalTransactionType: (x) => x['Type'],
          originalDate: (x) => x['Date & Time(UTC)'],
          price: (x) => BigNumber(x['Open price']),
          originalComment: (x) => x['Description'],
          fee: (x) => BigNumber(x['Commission'] ?? BigNumber(0)).plus(BigNumber(x['Swap'] ?? BigNumber(0))).plus(BigNumber(x['Rollover'] ?? BigNumber(0))),
          amount: (x) => BigNumber(x['QTY']),
          brokerAccount: (x) => x['Account'],
          symbol2: (x) => x['Coin'],
          originalValue: (x) => BigNumber(-1).times(x["Purchase value"] ? BigNumber(x["Purchase value"]) : (BigNumber(x["Margin"]))),
          wasDone: (x) => true,
          broker: (x) => 'XTB',
          transactionType: (originalTransactionType) => {
            return this.convertTransactionTypeBybit(originalTransactionType);
          },
          date: (x) => new Date(x['Date & Time(UTC)']),
          skip: (x) => x['Type'] === 'Stock sale' || x['Type'] === 'Stock purchase' || x['Type'] === 'swap' || x['Type'] === 'commision' || x['Type'] === 'rollover' || x['Type'] === 'close trade',
        };

        tradesFromOpenPositions.push(...convertDataToTrades(rows, xtbHeaders, xtbNonHeaderFields, openPositionsMappings));
        this.trades.push(...tradesFromOpenPositions);
      }
    }
  }

  private convertTransactionTypeBybit(transactionType: string): TransactionType {
    switch (transactionType) {
      case 'BUY':
        return TransactionType.Buy;
      case 'SELL':
        return TransactionType.Sell;
      case 'Free-funds Interest Tax':
        return TransactionType.FreeFundsInterestTax;
      case 'INTEREST':
      case 'BONUS':
        return TransactionType.FreeFundsInterest;
      case 'withdrawal':
      case 'IKE Deposit':
      case 'TRANSFER_OUT':
        return TransactionType.Withdrawal;
      case 'TRANSFER_IN':
        return TransactionType.Deposit;
      case 'DIVIDENT':
        return TransactionType.Dividend;
      case 'Withholding Tax':
        return TransactionType.DividendTax;
      case 'Sec Fee':
        return TransactionType.Fee;
      default:
        return TransactionType.Unknown;
    }
  }
}
