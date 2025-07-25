import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Trade } from '../models/tradeModels';

@Injectable({
  providedIn: 'root'
})
export class MyBackendService {
  private static readonly backendUrl: string = 'http://localhost:7137/api/'; // https://azurefunctionstradingapp.azurewebsites.net/api/

  constructor(private http: HttpClient) { }

  async getXTBLeverageTable(): Promise<string[]> {
    try {
      const result: string = await firstValueFrom(this.http.get<string>(`${MyBackendService.backendUrl}XTBLeverageTable`, { responseType: 'text' as 'json' }));
      let lines: string[] = JSON.parse(result);
      lines = lines.filter(line => line.trim().length > 0);
      return lines;
    }
    catch (error) {
      console.error('Error loading XTB leverage table:', error);
      throw error;
    }
  }

  async getTrades(): Promise<Trade[]> {
    try {
      const result: string = await firstValueFrom(this.http.get<string>(`${MyBackendService.backendUrl}TradingHistory`, { responseType: 'text' as 'json' }));
      const trades: Trade[] = JSON.parse(result).map((trade: any) => Trade.fromPlain(trade));
      return trades;
    } catch (error) {
      console.error('Error loading trades:', error);
      throw error;
    }
  }
}
