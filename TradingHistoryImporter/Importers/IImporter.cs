using ClosedXML.Excel;
using Trading.Domain.Models;

namespace TradingHistoryImporter.Importers;

internal interface IImporter
{
    string BrokerName { get; }
    XLWorkbook InputData { get; }

    Task<List<TradingHistoryRowModel>> Import();

    // <summary>
    // Checks if input data is in the importer format e.g. XTB importer checks if the input is in the XTB export file format
    // </summary>
    Task<bool> CheckInputData();
}