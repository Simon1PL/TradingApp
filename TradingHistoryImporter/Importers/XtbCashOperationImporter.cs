using ClosedXML.Excel;
using Trading.Domain.Models;

namespace TradingHistoryImporter.Importers;

internal class XtbCashOperationImporter(XLWorkbook workbook) : IImporter
{
    public string BrokerName => "XTB";
    XLWorkbook IImporter.InputData => workbook;

    private const string WorksheetName = "CASH OPERATION HISTORY";
    private readonly string[] ValuesInHeader = ["ID", "Typ", "Czas", "Komentarz", "Symbol", "Kwota"];

    public Task<List<TradingHistoryRowModel>> Import()
    {
        var result = new List<TradingHistoryRowModel>();

        var worksheet = workbook.Worksheet(WorksheetName);
        var headerRowNumber = XLWorkbookHelper.FindRow(worksheet, ValuesInHeader);
        var headerRow = worksheet.Row(headerRowNumber);
        var headersColumnsNumbers = GetHeadersColumnsNumbers(headerRow);
        var dataRows = worksheet.RowsUsed().Skip(headerRowNumber);
        foreach (var row in dataRows)
        {
            if (!double.TryParse(row.Cell(headersColumnsNumbers["Kwota"])?.Value.ToString(), out var price))
            {
                throw new Exception("Could not parse price which is required");
            }

            result.Add(new TradingHistoryRowModel
            {
                OperationName = row.Cell(headersColumnsNumbers["Typ"])?.Value.ToString(),
                Price = price,
                Sth = row.Cell(headersColumnsNumbers["Symbol"])?.Value.ToString()
            });
        }

        return Task.FromResult(result);
    }

    public Task<bool> CheckInputData()
    {
        var worksheet = workbook.Worksheet(WorksheetName);
        if (worksheet == null)
        {
            return Task.FromResult(false);
        }

        int headerRowNumber = XLWorkbookHelper.FindRow(worksheet, ValuesInHeader, false);
        if (headerRowNumber == -1)
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(true);
    }

    private Dictionary<string, int?> GetHeadersColumnsNumbers(IXLRow row)
    {
        return ValuesInHeader.ToDictionary(value => value, value => row.Cells().FirstOrDefault(cell => cell.Value.ToString()?.Trim() == value)?.Address?.ColumnNumber);
    }
}
