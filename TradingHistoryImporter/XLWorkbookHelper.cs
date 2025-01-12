using ClosedXML.Excel;

namespace TradingHistoryImporter;

internal static class XLWorkbookHelper
{
    internal static int FindRow(IXLWorksheet worksheet, string[] values, bool throwIfMissing = true, int maxRowNumber = 100)
    {
        for (int rowNumber = 1; rowNumber <= maxRowNumber; rowNumber++)
        {
            var row = worksheet.Row(rowNumber);
            bool allFound = values.All(value => row.Cells().Any(cell => cell.Value.ToString().Trim() == value));

            if (allFound)
            {
                return rowNumber;
            }
        }

        var errorMessage = $"Could not find row with values: {string.Join(", ", values)}";
        if (throwIfMissing)
        {
            throw new Exception(errorMessage);
        }

        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine(errorMessage);
        Console.ResetColor();
        return -1;
    }

    internal static IXLCell? Cell(this IXLRow row, int? columnNumber)
    {
        return columnNumber == null ? null : row.Cell(columnNumber);
    }
}
