import { Injectable } from '@angular/core';
import { Trade } from '../models/tradeModels';
import { HttpClient } from '@angular/common/http';
import { InstrumentsService } from './instruments.service';

@Injectable({
  providedIn: 'root'
})
export class TradesService {
  private trades: Trade[] = [];

  private static readonly tradesLocalStorageKey: string = "trades";

  constructor(private instrumentService: InstrumentsService) {
    this.loadTrades();
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  addTrades(trades: Trade[]): void {
    trades.sort((a, b) => a.date.getTime() - b.date.getTime());
    trades.forEach(trade => {
      this.addTrade(trade);
    });

    localStorage.setItem(TradesService.tradesLocalStorageKey, JSON.stringify(this.trades));
  }

  addTrade(trade: Trade): void {
    this.trades.push(trade);
    this.instrumentService.addTradeToInstruments(trade);
  }

  private findOpenPositionForTrade(trade: Trade): void {
    const symbolThatTradeIsCloseFor = trade.originalValue.gt(0) ? trade.symbol : trade.symbol2;
    const connectedTrades = this.trades.filter(x => 
      x.accountId === trade.accountId && 
      (x.symbol === symbolThatTradeIsCloseFor || x.symbol2 === symbolThatTradeIsCloseFor));
      
    if (connectedTrades.length > 0) {
      console.warn(`Trade with originalTransactionId ${trade.originalTransactionId} already exists. Skipping addition.`);
      return;
    }
  }

  clearCache(): void {
    localStorage.removeItem(TradesService.tradesLocalStorageKey);
    this.loadTrades();
  }

  async loadTrades(): Promise<void> {
    try {
      this.instrumentService.clear();
      this.trades = [];
      let loadedTrades = JSON.parse(localStorage.getItem(TradesService.tradesLocalStorageKey) ?? '[]') as Trade[];
      loadedTrades = loadedTrades.map(trade => Trade.fromPlain(trade));
      this.addTrades(loadedTrades);
    } catch (error) {
      console.error(error);
    }
  }

  recalculateTrades(accountId: string, instrumentSymbol: string): void {
    let closedTradesVolumeSum = 0;
    // trades.forEach(trade => {
    //     if (isCloseTrade(trade)) {
    //         trade.isCloseTrade = true;
    //         closedTradesVolumeSum += Math.abs(trade.amount ?? 0);
    //         trade.closedAmount = trade.amount;
    //     }
    // });

    // let i = 0;
    // while (closedTradesVolumeSum > 0 && i < trades.length) {
    //     if(trades[i].closedAmount === trades[i].amount) {
    //         i++;
    //         continue;
    //     }
        
    //     if (trades[i].amount >= closedTradesVolumeSum) {
    //         trades[i].closedAmount = closedTradesVolumeSum;
    //         closedTradesVolumeSum = 0;
    //     }
    //     else if (trades[i].amount < closedTradesVolumeSum) {
    //         closedTradesVolumeSum -= trades[i].amount;
    //         trades[i].closedAmount = trades[i].amount;
    //     }

    //     i++;
    // }

    // if (Math.round(closedTradesVolumeSum * 100) / 100 > 0) {
    //     console.error('Not all closed trades were closed!');
    //     console.error(trades);
    // }
  }
}
