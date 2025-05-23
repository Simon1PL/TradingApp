import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import * as XLSX from 'xlsx';
import { Trade } from '../models/tradeModels';
import { NonHeaderField, TradeFieldsMappings, convertDataToTrades } from '../helpers/dataConverter';
import { TradesService } from '../services/trades.service';
import { TransactionType } from '../models/tradeEnums';
import { excelDateToJSDate } from '../helpers/excelHelper';

@Component({
  standalone: true,
  selector: 'import-xtb',
  imports: [CommonModule, ButtonModule],
  templateUrl: './import-xtb.component.html',
  styleUrl: './import-xtb.component.scss'
})
export class ImportXTBComponent {
  trades: Trade[] = [];
  error: string = '';

  constructor(private tradeService: TradesService) { }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files![0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const binaryString = e.target.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        this.convertExcelDataToTradeModel(workbook);

        let balance = 0;
        this.trades.forEach(trade => {
          balance += trade.originalValue ?? 0;
        });
        console.log('Imported trades balance is', balance);
        // show window with imported trades to accept it

        this.tradeService.addTrades(this.trades.filter(trade => trade.originalDate));
      };
      reader.readAsBinaryString(file);
    }
  }

  private convertExcelDataToTradeModel(workbook: XLSX.WorkBook): void {
    const xtbHeaders = ['Comment', 'Symbol', 'Type'];
    const xtbNonHeaderFields = [
      new NonHeaderField('Account'),
      new NonHeaderField('Currency'),
      new NonHeaderField('Balance'),
    ];
    const openPositionSheet = 'OPEN POSITION';
    const closedPositionSheet = 'CLOSED POSITION HISTORY';
    const cashOperationSheet = 'CASH OPERATION HISTORY';
    let tradesFromOpenPositions: Trade[] = [];
    let tradesFromClosedPositions: Trade[] = [];
    let cashOperations: Trade[] = [];

    for (const sheetName of workbook.SheetNames) {
      if (sheetName.startsWith(openPositionSheet)) {
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const openPositionsMappings: TradeFieldsMappings = {
          originalTransactionId: (x) => x['Position'],
          symbol: (x) => x['Symbol'],
          originalTransactionType: (x) => x['Type'],
          originalDate: (x) => x['Open time'],
          price: (x) => Number(x['Open price']),
          originalComment: (x) => x['Comment'],
          fee: (x) => Number(x['Commission'] ?? 0) + Number(x['Swap'] ?? 0) + Number(x['Rollover'] ?? 0),
          amount: (x) => Number(x['Volume']),
          brokerAccount: (x) => x['Account'],
          currency: (x) => x['Currency'],
          originalValue: (x) => -1 * (x["Purchase value"] ? Number(x["Purchase value"]) : (Number(x["Margin"]))),
          wasDone: (x) => true,
          shouldBeOnMinus: (x) => true,
          broker: (x) => 'XTB',
          transactionType: (originalTransactionType) => {
            return this.convertTransactionTypeXTB(originalTransactionType);
          },
          date: (x) => excelDateToJSDate(x['Open time']),
        };

        tradesFromOpenPositions.push(...convertDataToTrades(rows, xtbHeaders, xtbNonHeaderFields, openPositionsMappings));
        this.trades.push(...tradesFromOpenPositions);
      }
      else if (sheetName === closedPositionSheet) {
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const closedPositionsOpenMappings: TradeFieldsMappings = {
          originalTransactionId: (x) => x['Position'],
          symbol: (x) => x['Symbol'],
          originalTransactionType: (x) => x['Type'],
          originalDate: (x) => x['Open time'],
          price: (x) => Number(x['Open price']),
          originalComment: (x) => x['Comment'],
          fee: (x) => 0, // its counted in close trade
          amount: (x) => Number(x['Volume']),
          brokerAccount: (x) => x['Account'],
          currency: (x) => x['Currency'],
          originalValue: (x) => new Function("x", `return ${`-1 * (x["Purchase value"] ? Number(x["Purchase value"]) : Number(x["Margin"]))`}`)(x), // Number(x["PurchaseValue"]) ?? (Number(x["Margin"]) + Number(x["Gross P/L"])),
          wasDone: (x) => true,
          shouldBeOnMinus: (x) => true,
          broker: (x) => 'XTB',
          transactionType: (originalTransactionType) => {
            return this.convertTransactionTypeXTB(originalTransactionType);
          },
          date: (x) => excelDateToJSDate(x['Open time']),
        };

        tradesFromClosedPositions.push(...convertDataToTrades(rows, xtbHeaders, xtbNonHeaderFields, closedPositionsOpenMappings));

        const closedPositionsCloseMappings: TradeFieldsMappings = {
          originalTransactionId: (x) => x['Position'],
          symbol: (x) => x['Symbol'],
          originalTransactionType: (x) => x['Type'] === 'BUY' ? 'SELL' : x['Type'] === 'SELL' ? 'BUY' : x['Type'],
          originalDate: (x) => x['Close time'],
          price: (x) => Number(x['Close price']),
          originalComment: (x) => x['Comment'],
          fee: (x) => Number(x['Commission'] ?? 0) + Number(x['Swap'] ?? 0) + Number(x['Rollover'] ?? 0),
          amount: (x) => Number(x['Volume']),
          brokerAccount: (x) => x['Account'],
          currency: (x) => x['Currency'],
          originalValue: (x) => x["Sale value"] ? Number(x["Sale value"]) : (Number(x["Margin"]) + Number(x["Gross P/L"])),
          wasDone: (x) => true,
          shouldBeOnMinus: (x) => false,
          broker: (x) => 'XTB',
          transactionType: (originalTransactionType) => {
            return this.convertTransactionTypeXTB(originalTransactionType);
          },
          date: (x) => excelDateToJSDate(x['Close time']),
        };

        tradesFromClosedPositions.push(...convertDataToTrades(rows, xtbHeaders, xtbNonHeaderFields, closedPositionsCloseMappings));
        this.trades.push(...tradesFromClosedPositions);
      }
      else if (sheetName === cashOperationSheet) {
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const cashOperationsMappings: TradeFieldsMappings = {
          originalTransactionId: (x) => x['ID'],
          symbol: (x) => x['Symbol'],
          originalTransactionType: (x) => x['Type'],
          originalDate: (x) => x['Time'],
          price: (x) => Number(x['Amount']),
          originalComment: (x) => x['Comment'],
          amount: (x) => 1,
          brokerAccount: (x) => x['Account'],
          currency: (x) => x['Currency'],
          originalValue: (x) => Number(x["Amount"]),
          wasDone: (x) => true,
          shouldBeOnMinus: (x) => false,
          broker: (x) => 'XTB',
          transactionType: (originalTransactionType) => {
            return this.convertTransactionTypeXTB(originalTransactionType);
          },
          date: (x) => excelDateToJSDate(x['Time']),
          skip: (x) => x['Type'] === 'Stock sale' || x['Type'] === 'Stock purchase' || x['Type'] === 'swap' || x['Type'] === 'commision' || x['Type'] === 'rollover' || x['Type'] === 'close trade',
        };

        cashOperations.push(...convertDataToTrades(rows, xtbHeaders, xtbNonHeaderFields, cashOperationsMappings));
        this.trades.push(...cashOperations);
      }
    }
  }

  private convertTransactionTypeXTB(transactionType: string): TransactionType {
    switch (transactionType) {
      case 'BUY':
        return TransactionType.Buy;
      case 'SELL':
        return TransactionType.Sell;
      case 'Free-funds Interest Tax':
        return TransactionType.FreeFundsInterestTax;
      case 'Free-funds Interest':
        return TransactionType.FreeFundsInterest;
      case 'withdrawal':
      case 'IKE Deposit':
      case 'transfer':
        return TransactionType.Withdrawal;
      case 'deposit':
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
