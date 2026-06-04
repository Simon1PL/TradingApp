using ExchangeDataHandler.CoinMarketCap;
using ExchangeDataHandler.MyData;
using ExchangeDataHandler.MyData.AzureContainer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Python.Runtime;
using SixLabors.ImageSharp;
using StockHistoryImporter;
using StockHistoryImporter.Stooq;
using System;
using Trading.Domain.Models.Crypto;
using Trading.Domain.Repositories;
using TradingApp.Persistence;

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables()
    .Build();

var services = new ServiceCollection();
services.AddInstrumentsPersistenceAndApplyMigrations();
services.AddSingleton<IConfiguration>(configuration);
services.AddSingleton<InstrumentsInfoSaver>();
var provider = services.BuildServiceProvider();

var instrumentsInfoSaver = provider.GetRequiredService<InstrumentsInfoSaver>();
//await instrumentsInfoSaver.SaveAsync();

var instrumentsBaseInfoRepository = provider.GetRequiredService<IInstrumentsBaseInfoRepository>();
var instruments = instrumentsBaseInfoRepository.GetAll();

return 0;

Runtime.PythonDLL = @"C:\Python311\python311.dll"; // or C:\Python311\ already in PATH on OS
PythonEngine.Initialize();
PythonEngine.BeginAllowThreads();

var date = DateTimeOffset.UtcNow.AddDays(-1);
var directoryWithDownloadedFiles = @"C:\Users\sxz04011\Desktop\Trade\TradingApp\DownloadedFiles";
var fileName = $"stooq_{date:yyyy-MM-dd}.csv";
await DataImporter.ImportUsingPlaywright(date, Path.Combine(directoryWithDownloadedFiles, fileName));

return 0;

IDataWriter dataWriter = new FileSaver(configuration);
var cryptoList = await new CoinListImporter().Get500CoinsList();
await dataWriter.SaveCryptoList(cryptoList.Select(x => new Crypto(x.Symbol, x.Name)), default);

//await new CoinmarketcapImporter().Get500CoinsList();
await new AzureBlobUploader(configuration).UploadFileToGoogleDrive("Files/coinmarketcap_500coins_list.csv", "text/csv");
