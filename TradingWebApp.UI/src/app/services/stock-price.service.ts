import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockPriceService {
  private static readonly backendUrl: string = 'http://localhost:7137/api/'; // https://azurefunctionstradingapp.azurewebsites.net/api/

  constructor(private http: HttpClient) { }

  async getPrice(ticker: string, date: Date = null!): Promise<string[]> {
    try {
      const yahooResponse = await this.getFromYahooRapidAPI([ticker], date);
      if (true) {
        console.log(`Response for ${ticker} on ${date?.toISOString()}:`, yahooResponse);
        const result = yahooResponse.chart.result[0];
        return [];
      } else {
        throw new Error('No data found for the given ticker and date.');
      }
    }
    catch (error) {
      console.error(`Error getting price for ${ticker}:`, error);
      throw error;
    }
  }

  private async getFromYahooRapidAPI(tickers: string[], startDate: Date = null!): Promise<any> {
    const apiUrl = 'https://apidojo-yahoo-finance-v1.p.rapidapi.com';
    const headers = new HttpHeaders({
      'X-RapidAPI-Key': '', // TO DO
      'X-RapidAPI-Host': 'apidojo-yahoo-finance-v1.p.rapidapi.com',
    });

    if (!startDate) { // get only current price
      const response = await firstValueFrom(this.http.get(`${apiUrl}/market/v2/get-quotes`, {
        headers: headers,
        params: {
          symbols: tickers.join(","),
        }
      })) as any;

      return response.quoteResponse.result[0]?.regularMarketPrice;
    }

    const range = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // in days
    return this.http.get(`${apiUrl}/stock/v3/get-chart`, {
      headers: headers,
      params: {
        interval: '1d',
        region: 'PL',
        symbol: tickers[0],
        range: `${range}d`, // e.g. 1y, 6mo, 3mo, 1mo, 5d, 1d
        includePrePost: 'false',
        useYfid: 'true',
        includeAdjustedClose: 'true',
        events: 'capitalGain,div,split'
      }
    });
  }
}
