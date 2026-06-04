using System.Text;
using Trading.Domain.Enums;
using Trading.Domain.Models.Instruments;
using Trading.Domain.Repositories;
using TradingApp.Persistence.LogFiles;

namespace StockHistoryImporter.Stooq;

internal class InstrumentsInfoSaver
{
    private const string DailyDataDirectory = @"C:\Users\sxz04011\Desktop\Trade\TradingApp\DownloadedFiles\data\daily";
    private const string OutputFileName = "instruments.csv";

    private readonly IInstrumentsBaseInfoRepository InstrumentsBaseInfoRepository;

    public InstrumentsInfoSaver(IInstrumentsBaseInfoRepository instrumentsBaseInfoRepository)
    {
        InstrumentsBaseInfoRepository = instrumentsBaseInfoRepository;
    }

    /// <summary>
    /// It reads the data from downloaded from stooq + data from stooq 'Preferred folders structure' saved in files with names 'ticker-name.csv'.
    /// Then creates new file 'instruments.csv' in each folder with 'ticker-name.csv' file with the following content:
    /// Id,Ticker,Name,Country,Exchange,Type for each correct instrument.
    /// It saves the data from all files also to InstrumentsBaseInfoRepository (database).
    /// Additionally, it logs all the issues with files and data to console and log file.
    /// </summary>
    public async Task SaveAsync(string dailyDataDirectory = DailyDataDirectory, string? outputFilePath = null)
    {
        if (!Directory.Exists(dailyDataDirectory))
            throw new DirectoryNotFoundException($"Directory '{dailyDataDirectory}' was not found.");
        
        foreach (var countryDirectory in Directory.EnumerateDirectories(dailyDataDirectory))
        {
            var country = Path.GetFileName(countryDirectory);
            if (!CountryMapper.TryParse(country, out var countryEnum))
            {
                LogToFileAndConsole.Log($"Unknown country '{country}' in file '{countryDirectory}'.", ConsoleColor.Magenta);
                continue;
            }

            foreach (var typeDirectory in Directory.EnumerateDirectories(countryDirectory))
            {
                var outputPath = outputFilePath ?? Path.Combine(typeDirectory, OutputFileName);
                var rows = new List<string>
                {
                    "Id,Ticker,Name,Country,Exchange,Type"
                };

                var tickerNameFilePath = Path.Combine(typeDirectory, "ticker-name.csv");
                if (!File.Exists(tickerNameFilePath))
                {
                    LogToFileAndConsole.Log($"File '{tickerNameFilePath}' was not found, skipping.");
                    continue;
                }

                var rawType = Path.GetFileName(typeDirectory);
                var (exchange, type) = ParseExchangeAndType(rawType);
                if (!InstrumentTypeMapper.TryParse(type, out var typeEnum))
                {
                    LogToFileAndConsole.Log($"Unknown instrument type '{type}' in file '{tickerNameFilePath}'.", ConsoleColor.Magenta);
                    continue;
                }

                var lines = await File.ReadAllLinesAsync(tickerNameFilePath);
                foreach (var line in lines.Skip(1))
                {
                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    var parts = line.Split([' ', '\t', ','], 2, StringSplitOptions.TrimEntries);
                    var ticker = parts.Length > 0 ? parts[0] : string.Empty;
                    var name = parts.Length > 1 ? parts[1] : string.Empty;
                    if (string.IsNullOrWhiteSpace(ticker) || string.IsNullOrWhiteSpace(name))
                    {
                        LogToFileAndConsole.Log($"Invalid line '{line}' in file '{tickerNameFilePath}'.", ConsoleColor.Magenta);
                        continue;
                    }

                    var directoriesWithDataFiles = new List<string>
                    {
                        typeDirectory,
                    };

                    var x = 1;
                    while (Directory.Exists(Path.Combine(typeDirectory, x.ToString())))
                    {
                        directoriesWithDataFiles.Add(Path.Combine(directoriesWithDataFiles.Last(), x.ToString()));
                        x++;
                    }

                    var matchingHistoricalFiles = Directory
                        .EnumerateFiles(typeDirectory, $"{ticker}.txt", SearchOption.AllDirectories)
                        .ToList();

                    if (matchingHistoricalFiles.Count == 0)
                    {
                        LogToFileAndConsole.Log($"File with historical data for ticker '{ticker}' was not found in '{typeDirectory}'.", ConsoleColor.Magenta);
                        continue;
                    }
                    else if (matchingHistoricalFiles.Any(file => new FileInfo(file).Length == 0))
                    {
                        //LogToFileAndConsole.Log($"File with historical data for ticker '{ticker}' exists but has 0B size in '{typeDirectory}', skipping it.", ConsoleColor.Yellow);
                        continue;
                    }

                    var id = Guid.NewGuid();
                    rows.Add(ToCsvLine(id.ToString(), ticker, name, country, exchange, type));
                    InstrumentsBaseInfoRepository.Add(new InstrumentBaseInfo(id, ticker, name, countryEnum, exchange, typeEnum));
                }

                await File.WriteAllLinesAsync(outputPath, rows, Encoding.UTF8);
                LogToFileAndConsole.Log($"Saved instruments info '{outputPath}'.", ConsoleColor.Green);
                Console.WriteLine();
                Console.WriteLine($"Logs saved to file: {LogToFileAndConsole.GetLogFilePath()}");
            }
        }

    }

    private static (string Exchange, string Type) ParseExchangeAndType(string rawType)
    {
        if (rawType.Split(' ', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).Length == 1)
            return (string.Empty, rawType);

        if (rawType.StartsWith("funds", StringComparison.OrdinalIgnoreCase))
            return (string.Empty, rawType);

        var split = rawType.Split(' ', 2, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (split.Length == 0)
            return (string.Empty, string.Empty);

        if (split.Length == 1)
            return (split[0], string.Empty);

        return (split[0], split[1]);
    }

    private static string ToCsvLine(params string[] values)
        => string.Join(',', values.Select(EscapeCsv));

    private static string EscapeCsv(string value)
    {
        if (value.Contains('"'))
            value = value.Replace("\"", "\"\"");

        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
            return $"\"{value}\"";

        return value;
    }
}
