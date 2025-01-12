using ClosedXML.Excel;
using System.Reflection;

namespace TradingHistoryImporter.Importers;

internal class ImporterFabric
{
    private readonly List<Type> availableImporters;

    public ImporterFabric()
    {
        availableImporters = Assembly.GetExecutingAssembly().GetTypes()
            .Where(type => typeof(IImporter).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
            .ToList();
    }

    public async Task<IImporter?> CreateImporter(string inputFilePath)
    {
        if (inputFilePath.EndsWith(".xlsx"))
        {
            var workbook = new XLWorkbook(inputFilePath);
            foreach (var importerClass in availableImporters)
            {
                var importer = (IImporter)Activator.CreateInstance(importerClass, workbook)!;
                if (await importer.CheckInputData())
                {
                    return importer;
                }
                else
                {
                    workbook.Dispose();
                }
            }
        }

        return null;
    }
}
