import { Injectable } from '@angular/core';
import { Trade } from '../models/tradeModels';
import { HttpClient } from '@angular/common/http';
import { TransactionType } from '../models/tradeEnums';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TradesService {
  private trades: Trade[] = [];

  constructor(private http: HttpClient) { }

  getTrades(): Trade[] {
    return this.trades;
  }

  async loadTrades(): Promise<void> {
    try {
      const result: string = await firstValueFrom(this.http.get<string>('https://azurefunctionstradingapp.azurewebsites.net/api/TradingHistory', { responseType: 'text' as 'json' }));
      console.log(result);
      this.trades = JSON.parse(JSON.stringify(exampleTrades));
    } catch (error) {
      console.error(error);
    }
  }
}

let exampleTrades = [
  {
    id: '1',
    symbol: 'MSFT',
    date: new Date('2023-01-01'),
    transactionType: TransactionType.Buy,
    originalTransactionId: '0',
    originalTransactionType: 'buy',
    price: 150,
    amount: 10,
    broker: 'Broker A',
    originalComment: 'Initial purchase',
    comments: [
      { id: '1', date: new Date('2023-01-01'), comment: 'First comment' },
      { id: '2', date: new Date('2023-01-02'), comment: 'Second comment' }
    ],
    wasDone: true
  },
  {
    id: '2',
    symbol: 'GOOGL',
    date: new Date('2023-02-01'),
    transactionType: TransactionType.Sell,
    originalTransactionId: '1',
    originalTransactionType: TransactionType.Buy,
    price: 2500,
    amount: 5,
    broker: 'Broker B',
    originalComment: 'Sold for profit',
    comments: [
      { id: '3', date: new Date('2023-02-01'), comment: 'Third comment' }
    ],
    wasDone: false
  },
];
