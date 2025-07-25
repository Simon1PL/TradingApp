import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import * as XLSX from 'xlsx';
import BigNumber from "bignumber.js";

@Component({
  standalone: true,
  selector: 'import-revolutx',
  imports: [ButtonModule],
  templateUrl: './import-revolutx.component.html',
  styleUrl: './import-revolutx.component.scss'
})
export class ImportRevolutxComponent {
  private symbol2Codes: string[] = [];
  private dates: string[] = [];
  private exchangeRates: string[][] = [];
  constructor(private http: HttpClient) {
    this.loadNBPExchangeRates();
  }

  async onFileChange(event: any): Promise<void> {
    const file = event.target.files[0];

    if (file) {
      const data = await this.convertRevoluXHtmlToArray(file);
      const filename = 'revolutx_data.xlsx';
      this.exportToExcel(filename, data);
    }
  }

  async onFileChange2(event: any): Promise<void> {
    const file = event.target.files[0];

    if (file) {
      if (file.name.endsWith('.html') || file.name.endsWith('.txt')) {
        let data = await this.convertRevoluXHtmlToArray(file);
        data = this.calculateTax(data);
        const filename = 'revolutx_data_with_tax.xlsx';
        this.exportToExcel(filename, data);
      }
      else {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const binaryString = e.target.result;
            const workbook = XLSX.read(binaryString, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            let rows: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            rows = rows.filter((row) => row?.length ?? 0 > 0);
            const data = this.calculateTax(rows);
            const filename = 'revolutx_data_with_tax.xlsx';
            this.exportToExcel(filename, data);
          };
          reader.readAsBinaryString(file);
      }
    }
  }

  private loadNBPExchangeRates(): void {
    this.http.get('Kursy_srednie_NBP_2024.csv', { responseType: 'text' }).subscribe(csvText => {
      csvText = csvText.replace(/,/g, '.');
      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      this.exchangeRates = rows;
      this.symbol2Codes = rows.find((row) => row[0] === 'kod ISO') ?? [];
      this.dates = rows.map((row) => row[0]?.toString());
    });
  }

  private getExchangeRateFromPreviousWorkingDay(date: Date, symbol2Code: string): BigNumber | null {
    if (symbol2Code === 'PLN') return BigNumber(1);

    let i = 0;
    while (i < 5) {
      date.setDate(date.getDate() - 1);
      i++;
      const formattedDate = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');

      const dateIndex = this.dates.indexOf(formattedDate);
      if (dateIndex === -1) continue;

      const symbol2Index = this.symbol2Codes.indexOf(symbol2Code);
      if (symbol2Index === -1) continue;

      const exchangeRate = this.exchangeRates[dateIndex][symbol2Index];
      return BigNumber((exchangeRate ?? '').toString().replace(',', '.'));
    }

    return null;
  }

  exportToExcel(filename: string, data: string[][]): void {
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RevolutX transactions');
    XLSX.writeFile(wb, filename);
  }

  async convertRevoluXHtmlToArray(file: File): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const result: string[][] = [];
          const htmlContent = e.target.result;
          const parser = new DOMParser();
          const html = parser.parseFromString(htmlContent, 'text/html');
          const rows = html.querySelectorAll('div[role="row"]');
          const headerRow = rows[0];
          const headerCells = headerRow.querySelectorAll('div[role="columnheader"]');

          var headers: string[] = [];
          headerCells.forEach((cell) => {
            const cellText = cell.textContent?.trim();
            headers.push(cellText ?? '');
          });

          result.push(headers);

          rows.forEach((row, index) => {
            if (index === 0) return;

            var rowTexts: string[] = [];
            const cells = row.querySelectorAll('div[role="cell"]');
            cells.forEach((cell) => {
              const cellText = cell.textContent?.trim();
              rowTexts.push(cellText ?? '');
            });

            result.push(rowTexts);
          });

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  calculateTax(revolutXCSVData: string[][]): string[][] {
    const dataForExcel: string[][] = [];

    revolutXCSVData.forEach((rowTexts, index) => {
      if (index === 0) {
        rowTexts.push('Date');
        rowTexts.push('Kurs NBP D-1');
        rowTexts.push('ValueInPln');
        rowTexts.push('PriceInPln');
        rowTexts.push('FeeInPln');
        dataForExcel.push(rowTexts);
        return;
      }

      const dateText = rowTexts[1];
      const date = new Date(dateText);
      let symbol2: string = rowTexts[0].split('-')[1].trim();
      let valueSign = BigNumber(1);
      if (rowTexts[2] === 'Buy') {
        valueSign = BigNumber(-1);
      }

      const formattedDate = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
      rowTexts.push(formattedDate);
      let nbp = this.getExchangeRateFromPreviousWorkingDay(date, symbol2) ?? 0;
      if (nbp === 0 && date.getFullYear() === 2024) {
        console.error(`Nie znaleziono kursu NBP dla waluty ${symbol2} na dzień ${formattedDate}`);
        rowTexts.push(`Nie znaleziono kursu NBP dla waluty ${symbol2} na dzień ${formattedDate}`);
      }
      else {
        rowTexts.push(nbp?.toString() ?? '');
      }

      const value = BigNumber(rowTexts[5].toString().replace(/[^0-9.-]+/g, ''));
      const valueInPln = valueSign.multipliedBy(value).multipliedBy(nbp);
      rowTexts.push(valueInPln.toFixed(2).toString());
      const price = BigNumber(rowTexts[4].replace(/[^0-9.-]+/g, ''));
      const priceInPln = price.multipliedBy(nbp);
      rowTexts.push(priceInPln.toString());
      const fee = BigNumber(rowTexts[6].toString().replace(/[^0-9.-]+/g, ''));
      let feeInPln = BigNumber(0);
      if (rowTexts[2] === 'Buy' && rowTexts[6] !== 'No fees') {
        feeInPln = fee.multipliedBy(priceInPln);
      }
      if (rowTexts[2] === 'Sell' && rowTexts[6] !== 'No fees') {
        feeInPln = fee.multipliedBy(nbp);
      }

      rowTexts.push(feeInPln.toFixed(2).toString());

      dataForExcel.push(rowTexts);
    });

    let valueInPlnSum = dataForExcel.reduce((sum, row) => {
      const valueInPln = Math.round(parseFloat(row[9]?.toString() ?? '0') * 100);
      return sum + (isNaN(valueInPln) ? 0 : valueInPln);
    }, 0);

    valueInPlnSum /= 100;
    dataForExcel[0].push('Przychody z krypto w 2024 w PLN');
    dataForExcel[0].push(valueInPlnSum.toString());

    let feesInPlnSum = dataForExcel.reduce((sum, row) => {
      const feeInPln = Math.round(parseFloat(row[11]?.toString() ?? '0') * 100);
      return sum + (isNaN(feeInPln) ? 0 : feeInPln);
    }, 0);

    feesInPlnSum /= 100;
    dataForExcel[0].push('Opłaty poniesione przy transakcjach w PLN');
    dataForExcel[0].push(feesInPlnSum.toString());

    dataForExcel[0].push('Przychody - opłaty');
    dataForExcel[0].push((Math.round((valueInPlnSum - feesInPlnSum) * 100) / 100).toString());

    return dataForExcel;
  }
}
