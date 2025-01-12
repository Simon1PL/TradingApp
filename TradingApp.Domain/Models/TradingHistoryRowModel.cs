namespace Trading.Domain.Models;

public class TradingHistoryRowModel
{
    public Guid? Id { get; set; }
    public string Symbol { get; set; }
    public DateTimeOffset? Date { get; set; }
    public string TransactionType { get; set; }
    public string? OriginalTransactionId { get; set; }
    public string? OriginalTransactionType { get; set; }
    public double Price { get; set; }
    public double Amount { get; set; } = 1.0;
    public string? Broker { get; set; }
    public string? OriginalComment { get; set; }
    public List<MyComment> Comments { get; set; } = [];
    public bool WasDone { get; set; }
}
