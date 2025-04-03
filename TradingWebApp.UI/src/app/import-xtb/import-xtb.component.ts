import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  standalone: true,
  selector: 'import-xtb',
  imports: [CommonModule],
  templateUrl: './import-xtb.component.html',
  styleUrl: './import-xtb.component.scss'
})
export class ImportXTBComponent {
  excelData: any[] = [];

  onFileChange(event: any): void {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const binaryString = e.target.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        this.excelData = XLSX.utils.sheet_to_json(sheet);
      };
      reader.readAsBinaryString(file);
    }
  }
}
