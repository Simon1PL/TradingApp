namespace Trading.Domain.Models.Instruments;

public record Instrument(string Symbol, string Name, bool IsCrypto = false, int? CoinmarketcapId = null);
