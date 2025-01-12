// using ClosedXML.Excel;

using Trading.Domain.Models;

namespace Trading.Domain;

internal class XlsxExporter
{
    private const string WORKSHEET_NAME = "Sheet1";

    internal void ExportToXLSX(List<TradingHistoryRowModel> data, string outputFilePath)
    {
        /*using var newWorkbook = new XLWorkbook();
        var newWorksheet = newWorkbook.AddWorksheet(WORKSHEET_NAME);
        newWorksheet.Cell(1, 1).Value = "XTB";
        newWorksheet.Cell(1, 2).Value = "Typ";
        newWorksheet.Cell(1, 3).Value = "Data";
        newWorksheet.Cell(1, 4).Value = "Komentarz";
        newWorksheet.Cell(1, 5).Value = "Symbol";
        newWorksheet.Cell(1, 6).Value = "Kwota";

        int rowIndex = 1;
        foreach (var row in data)
        {
            newWorksheet.Cell(rowIndex, 1).Value = row.Value;
            newWorksheet.Cell(rowIndex, 2).Value = row.OperationName;
            newWorksheet.Cell(rowIndex, 3).Value = row.Value;
            newWorksheet.Cell(rowIndex, 4).Value = row.Value;
            newWorksheet.Cell(rowIndex, 5).Value = row.Value;
            newWorksheet.Cell(rowIndex, 6).Value = row.Value;

            rowIndex++;
        }

        newWorkbook.SaveAs(outputFilePath);
        Console.WriteLine("New Excel file saved at: " + outputFilePath);*/
    }
}
