using ExchangeDataHandler.CoinMarketCap;
using ExchangeDataHandler.MyData;
using ExchangeDataHandler.MyData.AzureContainer;
using Microsoft.Extensions.Configuration;
using Microsoft.Playwright;
using Python.Runtime;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using StockHistoryImporter;
using StockHistoryImporter.Stooq;
using System.Net.Http.Headers;
using Tesseract;
using Trading.Domain.Models.Crypto;
using System.Linq;
using System.Collections.Generic;

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables()
    .Build();

await DataImporter.ImportUsingPlaywright(DateTimeOffset.UtcNow.AddDays(-1));

return 0;

IDataWriter dataWriter = new FileSaver(configuration);
var cryptoList = await new CoinListImporter().Get500CoinsList();
await dataWriter.SaveCryptoList(cryptoList.Select(x => new Crypto(x.Symbol, x.Name)), default);

//await new CoinmarketcapImporter().Get500CoinsList();
await new AzureBlobUploader(configuration).UploadFileToGoogleDrive("Files/coinmarketcap_500coins_list.csv", "text/csv");

//https://stooq.com/db/h/
//https://api.coinmarketcap.com/data-api/v3.1/cryptocurrency/historical?id=1027&timeStart=1648771200&interval=1d&convertId=2781
