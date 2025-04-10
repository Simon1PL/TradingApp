export function excelDateToJSDate(excelDate: string): Date {
    return new Date((Number(excelDate) - 25569) * 86400 * 1000);
}