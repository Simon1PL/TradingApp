namespace StockHistoryImporter;

// imprt top 500 coins from coinmarketcap.com and save to csv file for further processing
internal class CoinmarketcapImporter
{
    public async Task Get500CoinsList()
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
        //await File.WriteAllTextAsync("coinmarketcap_500coins_list2.json", json);
        //Console.WriteLine($"File saved to: {Path.GetFullPath("coinmarketcap_500coins_list2.json")}");

        // 2. Parse the JSON file and save to CSV file
        var json = await File.ReadAllTextAsync("Files/coinmarketcap_500coins_list.json");
        var doc = System.Text.Json.JsonDocument.Parse(json);
        var coins = doc.RootElement.GetProperty("data").EnumerateArray();
        using var writer = new StreamWriter("coinmarketcap_500coins_list.csv");
        writer.WriteLine("Id,Symbol,Name,Slug,Rank");
        foreach (var coin in coins)
        {
            var id = coin.GetProperty("id").GetInt32();
            var symbol = coin.GetProperty("symbol").GetString();
            var name = coin.GetProperty("name").GetString();
            var slug = coin.GetProperty("slug").GetString();
            var rank = coin.GetProperty("cmc_rank").GetInt32();
            writer.WriteLine($"{id},{symbol},{name},{slug},{rank}");
        }
        Console.WriteLine($"File saved to: {Path.GetFullPath("coinmarketcap_500coins_list.csv")}");
    }
}
