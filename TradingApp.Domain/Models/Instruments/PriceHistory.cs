namespace Trading.Domain.Models.Instruments;

public record PriceHistory(long Price, DateTimeOffset Date, long MaxPrice, long MinPrice, long StartPrice, long EndPrice);
