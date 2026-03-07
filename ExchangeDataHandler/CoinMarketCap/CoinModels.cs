namespace ExchangeDataHandler.CoinMarketCap;

internal record CoinModel(int CoinmarketcapId, string Symbol, string Name);

internal record CoinModelDetails(int CoinmarketcapId, string Symbol, string Name, string Slug, string PlatformSymbol, string[] Tags, DateTimeOffset DateAdded, long? MaxSupply, long? CirculatingSupply, long? TotalSupply);
