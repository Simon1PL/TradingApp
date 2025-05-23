import { Injectable } from '@angular/core';
import { Trade } from '../models/tradeModels';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { jsDateToExcelDate } from '../helpers/excelHelper';

@Injectable({
  providedIn: 'root'
})
export class TradesService {
  private trades: Trade[] = [];

  constructor(private http: HttpClient) {
    this.loadTrades();
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  addTrades(trades: Trade[]): void {
    this.trades.push(...trades);
  }

  async loadTrades(): Promise<void> {
    try {
      const result: string = await firstValueFrom(this.http.get<string>('https://azurefunctionstradingapp.azurewebsites.net/api/TradingHistory', { responseType: 'text' as 'json' }));
      console.log(result);
      this.trades = JSON.parse(JSON.stringify(exampleTrades));
      this.trades.forEach(trade => {
        trade.date = new Date(trade.date ?? '');
      });
    } catch (error) {
      console.error(error);
    }
  }
}

const exampleTrades: Trade[] = [
  new Trade({
    symbol: 'MSFT',
    broker: 'XTB',
    originalDate: jsDateToExcelDate(new Date('2023-01-02')),
    fee: 0,
    currency: 'USD',
    originalTransactionType: "BUY",
    brokerAccount: 'TEST',
    amount: 2,
    price: 65,
    originalValue: 130
  }),
  new Trade({
    symbol: 'MSFT',
    broker: 'XTB',
    originalDate: jsDateToExcelDate(new Date('2023-01-01')),
    fee: 0,
    currency: 'USD',
    originalTransactionType: "BUY",
    brokerAccount: 'TEST',
    amount: 2,
    price: 60,
    originalValue: 120
  }),
];
