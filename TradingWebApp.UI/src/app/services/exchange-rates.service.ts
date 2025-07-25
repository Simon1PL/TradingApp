import { Injectable } from '@angular/core';
import BigNumber from "bignumber.js";

@Injectable({
  providedIn: 'root'
})
export class ExchangeRatesService {
  constructor() { }

  async getExchangeRate(symbol: string, currency: string, date?: Date): Promise<BigNumber | null> {
    let result = await this.getExchangeRateFromAPI(symbol, currency, date);
    if (result) {
      return result;
    }

    result = await this.getExchangeRateFromAPI(currency, symbol, date);

    if (result) {
      return BigNumber('1').div(result);
    }

    console.warn(`Exchange rate for ${symbol} to ${currency} not found`);
    return null;
  }

  private getExchangeRateFromAPI(symbol: string, currency: string, date?: Date): Promise<BigNumber | null> {
    return new Promise((resolve) => {
      resolve(BigNumber("0.85"));
      // if doesn't exist return null
    });
  }
}
