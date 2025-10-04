using Microsoft.Extensions.Configuration;
using StockHistoryImporter;

// Build configuration from appsettings.json
var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true)
    .Build();

//await new CoinmarketcapImporter().Get500CoinsList();
await new AzureBlobUploader(configuration).UploadFileToGoogleDrive("Files/coinmarketcap_500coins_list.csv", "text/csv");

//https://stooq.com/db/h/
//https://api.coinmarketcap.com/data-api/v3.1/cryptocurrency/historical?id=1027&timeStart=1648771200&interval=1d&convertId=2781
