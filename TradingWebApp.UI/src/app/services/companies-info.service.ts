import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CompaniesInfoService {
  private companiesIcons: { [key: string]: string } = {
    'MSFT': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8u8BZcgcIxcfgSJsas_HDf2pfYTBlmo2q3g&s',
  };

  constructor() { }

  getCompanyIcon(symbol: string): string | undefined {
    return this.companiesIcons[symbol];
  }
}
