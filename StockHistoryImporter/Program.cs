using ExchangeDataHandler.CoinMarketCap;
using ExchangeDataHandler.MyData;
using ExchangeDataHandler.MyData.AzureContainer;
using Microsoft.Extensions.Configuration;
using SixLabors.ImageSharp;
using StockHistoryImporter;
using StockHistoryImporter.Stooq;
using Trading.Domain.Models.Crypto;

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables()
    .Build();

var date = DateTimeOffset.UtcNow.AddDays(-1);
var directoryWithDownloadedFiles = @"C:\Users\sxz04011\Desktop\Trade\TradingApp\DownloadedData";
var fileName = $"stooq_{date:yyyy-MM-dd}.csv";
await DataImporter.ImportUsingPlaywright(date, Path.Combine(directoryWithDownloadedFiles, fileName));

return 0;

IDataWriter dataWriter = new FileSaver(configuration);
var cryptoList = await new CoinListImporter().Get500CoinsList();
await dataWriter.SaveCryptoList(cryptoList.Select(x => new Crypto(x.Symbol, x.Name)), default);

//await new CoinmarketcapImporter().Get500CoinsList();
await new AzureBlobUploader(configuration).UploadFileToGoogleDrive("Files/coinmarketcap_500coins_list.csv", "text/csv");
