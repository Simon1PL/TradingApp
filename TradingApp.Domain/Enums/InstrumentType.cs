namespace Trading.Domain.Enums;

public enum InstrumentType
{
    None,
    Stock,
    Crypto,
    Forex,
    Commodity,
    Index,
    Bond,
    ETF,
    Currency
}

public static class InstrumentTypeMapper
{
    public static bool TryParse(string? value, out InstrumentType instrumentType)
    {
        instrumentType = value?.Replace(" ", "", StringComparison.Ordinal).ToUpperInvariant() switch
        {
            "STOCK" or "STOCKS" => InstrumentType.Stock,
            "CRYPTO" or "CRYPTOCURRENCY" or "CRYPTOCURRENCIES" => InstrumentType.Crypto,
            "FOREX" or "FEATURES" => InstrumentType.Forex,
            "COMMODITY" => InstrumentType.Commodity,
            "INDEX" or "INDICES" or "STOCKSINDICES" or "INDICESINDICATORS" => InstrumentType.Index,
            "BOND" or "BONDS" => InstrumentType.Bond,
            "ETF" or "ETFS" => InstrumentType.ETF,
            "CURRENCY" or "CURRENCIES" => InstrumentType.Currency,
            _ => InstrumentType.None
        };

        return instrumentType != InstrumentType.None;
    }
}
