import { Injectable } from '@angular/core';
import { Trade, UITrade, UITradeInstrument } from '../models/tradeModels';
import { HttpClient } from '@angular/common/http';
import { TransactionType } from '../models/tradeEnums';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TradesService {
  private trades: Trade[] = [];
  private groupedUITrades: UITradeInstrument[] = [];

  constructor(private http: HttpClient) { }

  getTrades(): Trade[] {
    return this.trades;
  }

  getGroupedUITrades(): UITradeInstrument[] {
    return this.groupedUITrades;
  }

  addTrades(trades: Trade[]): void {
    this.trades.push(...trades);
    this.reloadGroupedUITrades();
  }

  async loadTrades(): Promise<void> {
    try {
      const result: string = await firstValueFrom(this.http.get<string>('https://azurefunctionstradingapp.azurewebsites.net/api/TradingHistory', { responseType: 'text' as 'json' }));
      console.log(result);
      this.trades = JSON.parse(JSON.stringify(exampleTrades));
      this.trades.forEach(trade => {
        trade.date = new Date(trade.date ?? '');
      });
      this.reloadGroupedUITrades();
    } catch (error) {
      console.error(error);
    }
  }

  private reloadGroupedUITrades(): void {
    const grouped = new Map<string, Trade[]>();
    for (const trade of this.trades as UITrade[]) {
      if (!grouped.has(trade.symbol)) {
        grouped.set(trade.symbol, []);
      }

      if(trade.shouldBeOnMinus !== undefined) {
        trade.calculatedValue = (trade.shouldBeOnMinus ? -1 : 1) * Math.abs((trade.price ?? 0) * (trade.amount ?? 0)) - Math.abs(trade.fee ?? 0);
      }
      else {
        trade.calculatedValue = (trade.price ?? 0) * (trade.amount ?? 0) - Math.abs(trade.fee ?? 0);
      }

      grouped.get(trade.symbol)?.push(trade);
    }

    grouped.forEach((trades, symbol) => {
      const instrument: UITradeInstrument = {
        symbol,
        currentAmount: 0,
        currentPrice: undefined,
        currentProfit: undefined,
        currentProfitPercent: undefined,
        meanBuyPrice: 0,
        meanSellPrice: 0,
        pastProfit: 0,
        pastProfitPercent: 0,
        meanPastProfitPercentPerMonth: 0,
        trades
      };

      let buyValueSum = 0;
      let sellValueSum = 0;
      let buyVolumeSum = 0;
      let sellVolumeSum = 0;
      let timeSum = 0;
      trades.forEach(trade => {
        if (trade.transactionType === TransactionType.Buy || trade.transactionType === TransactionType.Dividend) {
          buyVolumeSum += trade.amount;
          buyValueSum += trade.originalValue ?? 0;
          timeSum += (trade.date?.getTime() ?? 0) * (trade.amount ?? 0);
        }
        if (trade.transactionType === TransactionType.Sell || trade.transactionType === TransactionType.DividendTax) {
          sellVolumeSum -= trade.amount;
          sellValueSum -= trade.originalValue ?? 0;
          timeSum -= (trade.date?.getTime() ?? 0) * (trade.amount ?? 0);
        }
      });

      instrument.symbol = trades[0].symbol;
      instrument.meanBuyPrice = buyVolumeSum !== 0 ? buyValueSum / buyVolumeSum : 0;
      instrument.meanSellPrice = sellVolumeSum !== 0 ? sellValueSum / sellVolumeSum : 0;
      instrument.currentAmount = buyVolumeSum + sellVolumeSum;
      instrument.pastProfit = Math.min(buyVolumeSum, sellVolumeSum) * (instrument.meanBuyPrice - instrument.meanSellPrice);
      instrument.pastProfitPercent = instrument.meanBuyPrice !== 0 ? (instrument.meanBuyPrice - instrument.meanSellPrice) / instrument.meanBuyPrice * 100 : 0;
      instrument.currentAmount = buyVolumeSum - sellVolumeSum;
      instrument.meanPastProfitPercentPerMonth = instrument.pastProfitPercent / timeSum / (1000 * 60 * 60 * 24 * 30);

      this.groupedUITrades.push(instrument);
    });
  }
}

const exampleTrades: Trade[] = [
  {
    id: '1',
    symbol: 'MSFT',
    date: new Date('2023-01-01'),
    originalDate: '2023-01-01',
    fee: 0,
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
    originalDate: '2023-02-01',
    fee: 0,
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
