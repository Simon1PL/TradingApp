export function excelDateToJSDate(excelDate: string): Date {
    return new Date((Number(excelDate) - 25569) * 86400 * 1000);
}

export function jsDateToExcelDate(jsDate: Date): string {
    return ((jsDate.getTime() / 1000 / 86400) + 25569).toString();
}