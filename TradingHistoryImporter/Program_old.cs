// manually class injection
using TradingHistoryImporter.Importers;

var importerFabric = new ImporterFabric();

// input
const string INPUT_FILE_NAME = "sth.xlsx";

var importer = await importerFabric.CreateImporter(INPUT_FILE_NAME);
if (importer == null)
{
    Console.WriteLine("Unsupported file format");
    return;
}

var data = await importer.Import();
string outputFilePath = Path.Combine(Path.GetDirectoryName(INPUT_FILE_NAME) ?? string.Empty, $"{importer.BrokerName}_{DateTimeOffset.UtcNow.ToString("yyyy-MM-dd")}.xlsx");
