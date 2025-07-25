import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import * as XLSX from 'xlsx';
import { Trade } from '../models/tradeModels';
import { NonHeaderField, TradeFieldsMappings, convertDataToTrades } from '../helpers/dataConverter';
import { TradesService } from '../services/trades.service';
import { TransactionType } from '../models/tradeEnums';
import { excelDateToJSDate } from '../helpers/excelHelper';
import BigNumber from "bignumber.js";
import { MyBackendService } from '../services/my-backend.service';

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
  leverageTable: string[] = [];

  constructor(private tradeService: TradesService, private myBackendService: MyBackendService) { }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files![0];

    if (file) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        this.leverageTable = await this.myBackendService.getXTBLeverageTable();

        const binaryString = e.target.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        this.convertExcelDataToTradeModel(workbook);

        let balance = BigNumber(0);
        this.trades.forEach(trade => {
          balance.plus(trade.originalValue ?? BigNumber(0));
        });
        console.log('Imported trades balance is', balance.toFixed(2));
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
          price: (x) => BigNumber(x['Open price']),
          originalComment: (x) => x['Comment'],
          fee: (x) => BigNumber(x['Commission'] ?? 0).plus(BigNumber(x['Swap'] ?? 0)).plus(BigNumber(x['Rollover'] ?? 0)),
          amount: (x) => BigNumber(x['Volume']),
          brokerAccount: (x) => x['Account'],
          symbol2: (x) => x['Currency'],
          originalValue: (x) => BigNumber(-1).times(x["Purchase value"] ? BigNumber(x["Purchase value"]) : (BigNumber(x["Margin"]))),
          wasDone: (x) => true,
          broker: (x) => 'XTB',
          transactionType: (originalTransactionType) => {
            return this.convertTransactionTypeXTB(originalTransactionType);
          },
          date: (x) => excelDateToJSDate(x['Open time']),
          leverage: (x) => {
            const isLeverage = x["Margin"] && x["Margin"] !== '0';
            if (isLeverage) {
              return BigNumber(this.getLeverageForSymbol(x['Symbol']));
            }

            return BigNumber(1);
          },
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
          price: (x) => BigNumber(x['Open price']),
          originalComment: (x) => x['Comment'],
          fee: (x) => BigNumber(0), // its counted in close trade
          amount: (x) => BigNumber(x['Volume']),
          brokerAccount: (x) => x['Account'],
          symbol2: (x) => x['Currency'],
          originalValue: (x) => BigNumber(new Function("x", `return ${`-1 * (x["Purchase value"] ? Number(x["Purchase value"]) : Number(x["Margin"]))`}`)(x)), // using string as a function to test if user can pass it.
          wasDone: (x) => true,
          broker: (x) => 'XTB',
          transactionType: (originalTransactionType) => {
            return this.convertTransactionTypeXTB(originalTransactionType);
          },
          date: (x) => excelDateToJSDate(x['Open time']),
          leverage: (x) => {
            const isLeverage = x["Margin"] && x["Margin"] !== '0';
            if (isLeverage) {
              return BigNumber(this.getLeverageForSymbol(x['Symbol']));
            }

            return BigNumber(1);
          },
        };

        tradesFromClosedPositions.push(...convertDataToTrades(rows, xtbHeaders, xtbNonHeaderFields, closedPositionsOpenMappings));

        const closedPositionsCloseMappings: TradeFieldsMappings = {
          originalTransactionId: (x) => x['Position'],
          symbol: (x) => x['Symbol'],
          originalTransactionType: (x) => x['Type'] === 'BUY' ? 'SELL' : x['Type'] === 'SELL' ? 'BUY' : x['Type'],
          originalDate: (x) => x['Close time'],
          price: (x) => BigNumber(x['Close price']),
          originalComment: (x) => x['Comment'],
          fee: (x) => BigNumber(x['Commission'] ?? 0).plus(BigNumber(x['Swap'] ?? 0)).plus(BigNumber(x['Rollover'] ?? 0)),
          amount: (x) => BigNumber(x['Volume']),
          brokerAccount: (x) => x['Account'],
          symbol2: (x) => x['Currency'],
          originalValue: (x) => x["Sale value"] ? BigNumber(x["Sale value"]) : (BigNumber(x["Margin"]).plus(BigNumber(x["Gross P/L"]))),
          wasDone: (x) => true,
          broker: (x) => 'XTB',
          transactionType: (originalTransactionType) => {
            return this.convertTransactionTypeXTB(originalTransactionType);
          },
          date: (x) => excelDateToJSDate(x['Close time']),
          leverage: (x) => {
            const isLeverage = x["Margin"] && x["Margin"] !== '0';
            if (isLeverage) {
              return BigNumber(this.getLeverageForSymbol(x['Symbol']));
            }

            return BigNumber(1);
          },
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
          price: (x) => BigNumber(x['Amount']),
          originalComment: (x) => x['Comment'],
          amount: (x) => BigNumber(0),
          brokerAccount: (x) => x['Account'],
          symbol2: (x) => x['Currency'],
          originalValue: (x) => BigNumber(x["Amount"]),
          wasDone: (x) => true,
          broker: (x) => 'XTB',
          transactionType: (originalTransactionType) => {
            return this.convertTransactionTypeXTB(originalTransactionType);
          },
          date: (x) => excelDateToJSDate(x['Time']),
          leverage: (x) => {
            const isLeverage = x["Margin"] && x["Margin"] !== '0';
            if (isLeverage) {
              return BigNumber(this.getLeverageForSymbol(x['Symbol']));
            }

            return BigNumber(1);
          },
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

  private getLeverageForSymbol(symbol: string): BigNumber {
    let lastPercentInFile = "";
    for (const line of this.leverageTable) {
      if (lastPercentInFile && line.includes(symbol)) {
        return BigNumber(100).div(BigNumber(lastPercentInFile.replace('%', ''))); // e.g. 25% means 100/25 = 4x leverage
      }

      const parts = line.split(' ');

      if (parts.length == 1 && parts[0].includes("%")) {
        lastPercentInFile = parts[0].trim();
        continue;
      };

      if (parts.length > 3 && parts[0] === symbol && parts[2].includes(":")) {
        const stringLeverage = parts[2].trim().replace('(', '').replace(')', ''); // e.g. "1:30", it means 30x leverage
        const leftSide = BigNumber(stringLeverage.split(':')[0].trim());
        const rightSide = BigNumber(stringLeverage.split(':')[1].trim());
        const leverageValue =  rightSide.div(leftSide);
        return leverageValue;
      }
    }

    return BigNumber(1);
  }
}
