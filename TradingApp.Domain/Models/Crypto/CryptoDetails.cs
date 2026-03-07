namespace Trading.Domain.Models.Crypto;

public record CryptoDetails(string Symbol, string Name, string? PlatformSymbol, string[] Tags, DateTimeOffset DateAdded, double? MaxSupply, double? CirculatingSupply, double? TotalSupply);
