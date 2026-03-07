namespace ExchangeDataHandler.MyData;

using Trading.Domain.Models.Crypto;
using Trading.Domain.Models.Instruments;

public interface IDataWriter
{
    Task SaveCryptoList(IEnumerable<Crypto> cryptoList, CancellationToken cancellationToken);
    Task SaveCryptoDetailsList(IEnumerable<CryptoDetails> cryptoDetailsList, CancellationToken cancellationToken);
    Task SaveStockList(IEnumerable<Instrument> instrumentList, CancellationToken cancellationToken);
    Task SaveHistory(IEnumerable<PriceHistory> priceHistoryList, CancellationToken cancellationToken);
}
