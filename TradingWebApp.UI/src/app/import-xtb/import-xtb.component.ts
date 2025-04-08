import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import * as XLSX from 'xlsx';
import { Trade } from '../models/tradeModels';
import { BeforeHeaderFieldMapping, DataConverter, HeaderFieldMapping } from '../models/dataConverter';
import { TradesService } from '../services/trades.service';
import { TransactionType } from '../models/tradeEnums';

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

  onFileChange(event: any): void {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const binaryString = e.target.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        this.convertExcelDataToTradeModel(workbook);
        this.tradeService.addTrades(this.trades.filter(trade => trade.originalDate));
      };
      reader.readAsBinaryString(file);
    }
  }

  convertExcelDataToTradeModel(workbook: XLSX.WorkBook): void {
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
        tradesFromOpenPositions.push(...new DataConverter([
          new HeaderFieldMapping('Position', 'originalTransactionId'),
          new HeaderFieldMapping('Symbol', 'symbol'),
          new HeaderFieldMapping('Type', 'originalTransactionType'),
          new HeaderFieldMapping('Volume', 'amount'),
          new HeaderFieldMapping('Open time', 'originalDate'),
          new HeaderFieldMapping('Open price', 'price'),
          new HeaderFieldMapping('Comment', 'originalComment'),
          new HeaderFieldMapping('Commission', 'fees1'),
          new HeaderFieldMapping('Swap', 'fees2'),
          new HeaderFieldMapping('Rollover', 'fees3'),
          new HeaderFieldMapping('Purchase value', 'expectedValue'),
        ], [
          new BeforeHeaderFieldMapping('Account', 'brokerAccount'),
          new BeforeHeaderFieldMapping('Currency', 'currency'),
        ]).convert(rows));

        this.trades.push(...tradesFromOpenPositions);
      }
      else if (sheetName === closedPositionSheet) {
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        tradesFromClosedPositions.push(...new DataConverter([
          new HeaderFieldMapping('Position', 'originalTransactionId'),
          new HeaderFieldMapping('Symbol', 'symbol'),
          new HeaderFieldMapping('Type', 'originalTransactionType'),
          new HeaderFieldMapping('Volume', 'amount'),
          new HeaderFieldMapping('Open time', 'originalDate'),
          new HeaderFieldMapping('Open price', 'price'),
          new HeaderFieldMapping('Comment', 'originalComment'),
          new HeaderFieldMapping('Commission', 'fees1'),
          new HeaderFieldMapping('Swap', 'fees2'),
          new HeaderFieldMapping('Rollover', 'fees3'),
          new HeaderFieldMapping('Purchase value', 'expectedValue'),
        ], [
          new BeforeHeaderFieldMapping('Account', 'brokerAccount'),
          new BeforeHeaderFieldMapping('Currency', 'currency'),
        ]).convert(rows));

        tradesFromClosedPositions.push(...new DataConverter([
          new HeaderFieldMapping('Position', 'originalTransactionId'),
          new HeaderFieldMapping('Symbol', 'symbol'),
          new HeaderFieldMapping('Volume', 'amount'),
          new HeaderFieldMapping('Close time', 'originalDate'),
          new HeaderFieldMapping('Close price', 'price'),
          new HeaderFieldMapping('Comment', 'originalComment'),
          new HeaderFieldMapping('Commission', 'fees1'),
          new HeaderFieldMapping('Swap', 'fees2'),
          new HeaderFieldMapping('Rollover', 'fees3'),
          new HeaderFieldMapping('Sale value', 'expectedValue'),
        ], [
          new BeforeHeaderFieldMapping('Account', 'brokerAccount'),
          new BeforeHeaderFieldMapping('Currency', 'currency'),
        ])
        .convert(rows)
        .map(trade => {
          trade.originalTransactionType = 'Sell';
          trade.transactionType = TransactionType.Sell;
          return trade;
        }));

        this.trades.push(...tradesFromClosedPositions);
      }
      else if (sheetName === cashOperationSheet) {
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        cashOperations.push(...new DataConverter([
          new HeaderFieldMapping('ID', 'originalTransactionId'),
          new HeaderFieldMapping('Symbol', 'symbol'),
          new HeaderFieldMapping('Type', 'originalTransactionType'),
          new HeaderFieldMapping('Time', 'originalDate'),
          new HeaderFieldMapping('Comment', 'originalComment'),
          new HeaderFieldMapping('Amount', 'price'),
        ], [
          new BeforeHeaderFieldMapping('Account', 'brokerAccount'),
          new BeforeHeaderFieldMapping('Currency', 'currency'),
        ])
        .convert(rows)
        .filter(trade =>
          trade.originalTransactionType !== 'Stock sale' &&
          trade.originalTransactionType !== 'Stock purchase' &&
          trade.originalTransactionType !== 'close trade'));

          this.trades.push(...cashOperations);
      }
    }
  }
}
