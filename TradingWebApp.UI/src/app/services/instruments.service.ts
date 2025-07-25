import { Injectable } from '@angular/core';
import { TradeInstrument } from '../models/instrumentModels';
import { Trade } from '../models/tradeModels';
import { ExchangeRatesService } from './exchange-rates.service';
import BigNumber from "bignumber.js";

@Injectable({
  providedIn: 'root'
})
export class InstrumentsService {
  private instruments: TradeInstrument[] = [];
  private instrumentsIcons: { [key: string]: string } = {
    'MSFT': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8u8BZcgcIxcfgSJsas_HDf2pfYTBlmo2q3g&s',
  };

  constructor(public exchangeRatesService: ExchangeRatesService) { }

  clear(): void {
    this.instruments = [];
  }

  getCompanyIcon(symbol: string): string | undefined {
    return this.instrumentsIcons[symbol];
  }

  getInstruments(instrumentSymbol?: string, accountId?: string, currency?: string): TradeInstrument[] {
    let instruments = this.instruments;
    if (instrumentSymbol) {
      instruments = instruments.filter(i => i.symbol === instrumentSymbol);
    }

    if (accountId) {
      instruments = instruments.filter(i => i.accountId === accountId);
    }

    if (currency) {
      instruments = instruments.filter(i => i.currency === currency);
    }

    return instruments;
  }

  getOrCreateInstrument(accountId: string, instrumentSymbol: string, currency: string): TradeInstrument {
    let instrument = this.instruments.find(x => 
      x.accountId === accountId &&
      x.symbol === instrumentSymbol &&
      x.currency === currency
    );

    if (!instrument) {
      instrument = new TradeInstrument(instrumentSymbol, currency, accountId);
      this.instruments.push(instrument);
    }

    return instrument;
  }

  addTradeToInstruments(trade: Trade) {
    if (trade.symbol2) {
      this.getOrCreateInstrument(trade.accountId, trade.symbol, trade.symbol2).addTrade(trade);
      this.getOrCreateInstrument(trade.accountId, trade.symbol2, trade.symbol).addTrade(trade);
    }
    else {
      this.getOrCreateInstrument(trade.accountId, trade.symbol, trade.symbol).addTrade(trade);
    }
  }

  async getInstrumentsCalculatedToSelectedCurrency(selectedCurrency: string, symbol: string, accountId?: string): Promise<TradeInstrument[]> {
    const instruments = this.getInstruments(symbol, accountId);
    const summaryInstrument = new TradeInstrument(symbol, selectedCurrency, accountId);
    const otherInstruments: TradeInstrument[] = [];
    for (const instrument of instruments) {
      const exchangeRate = instrument.currency === selectedCurrency ? 
        BigNumber('1') : 
        await this.exchangeRatesService.getExchangeRate(instrument.symbol, selectedCurrency);

      if (!exchangeRate) {
        otherInstruments.push(instrument);
      }

      instrument.addInstrumentWithOtherCurrency(instrument, exchangeRate!);
    };

    return [summaryInstrument, ...otherInstruments];
  }
}
