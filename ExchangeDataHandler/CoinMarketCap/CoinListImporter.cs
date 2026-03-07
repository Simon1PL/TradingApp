using System.Text.Json;
using Trading.Domain.Models.Crypto;
using Trading.Domain.Models.Instruments;

namespace ExchangeDataHandler.CoinMarketCap;

public class CoinListImporter
{
    public async Task<List<CryptoDetails>> Get500CoinsList()
    {
        // 1. Get the data from coinmarketcap.com API
        // it is already downloaded to the file "coinmarketcap_500coins_list.json"
        // free API key was used: https://coinmarketcap.com/api/
        //var client = new HttpClient();
        //var request = new HttpRequestMessage(HttpMethod.Get, "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=500");
        //request.Headers.Add("X-CMC_PRO_API_KEY", "<APIKEY>");
        //var response = await client.SendAsync(request);
        //response.EnsureSuccessStatusCode();
        //var json = await response.Content.ReadAsStringAsync();
        //await File.WriteAllTextAsync("coinmarketcap_500coins_list.json", json);
        //Console.WriteLine($"File saved to: {Path.GetFullPath("coinmarketcap_500coins_list.json")}");

        // 2. Parse the JSON file and save to CSV file
        var jsonRead = await File.ReadAllTextAsync("Files/coinmarketcap_500coins_list.json");
        var doc = JsonDocument.Parse(jsonRead);
        var coins = doc.RootElement.GetProperty("data").EnumerateArray();
        var coinList = new List<CryptoDetails>();
        foreach (var coin in coins)
        {
            var symbol = coin.GetProperty("symbol").GetString();
            var name = coin.GetProperty("name").GetString();
            var platformSymbol = coin.GetProperty("platform").ValueKind == JsonValueKind.Object ? coin.GetProperty("platform").GetProperty("symbol").GetString() : null;
            var tags = coin.GetProperty("tags").EnumerateArray().Select(t => t.GetString() ?? "").ToArray();
            var dateAdded = coin.GetProperty("date_added").GetDateTimeOffset();
            double? maxSupply = coin.GetProperty("max_supply").ValueKind == JsonValueKind.Number ? coin.GetProperty("max_supply").GetDouble() : null;
            var circulatingSupply = coin.GetProperty("circulating_supply").GetDouble();
            var totalSupply = coin.GetProperty("total_supply").GetDouble();
            coinList.Add(new CryptoDetails(symbol, name, platformSymbol, tags, dateAdded, maxSupply, circulatingSupply, totalSupply));
        }

        return coinList;
    }

    private async Task<List<PriceHistory>> GetCoinHistory(int coinId, DateTime startDate, DateTime endDate)
    {
        // Example: https://api.coinmarketcap.com/data-api/v3/cryptocurrency/historical?id=1027&timeStart=1648771200&interval=1d&convertId=2781
        var client = new HttpClient();
        var startTimestamp = ((DateTimeOffset)startDate).ToUnixTimeSeconds();
        var endTimestamp = ((DateTimeOffset)endDate).ToUnixTimeSeconds();
        var requestUrl = $"https://api.coinmarketcap.com/data-api/v3/cryptocurrency/historical?id={coinId}&timeStart={startTimestamp}&timeEnd={endTimestamp}&interval=1d&convertId=2781";
        var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        var result = new List<PriceHistory>();

        return result;
    }
}
