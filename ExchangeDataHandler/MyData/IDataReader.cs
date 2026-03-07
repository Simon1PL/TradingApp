namespace ExchangeDataHandler.MyData;

using Trading.Domain.Models.Crypto;
using Trading.Domain.Models.Instruments;

internal interface IDataReader
{
    List<Crypto> GetCryptoList();
    List<CryptoDetails> GetCryptoDetailsList();
    List<Instrument> GetStockList();
    List<Instrument> GetInstrumentList();
    List<PriceHistory>GetHistory(string symbol, DateTimeOffset startDate, DateTimeOffset endDate, InstrumentHistoryIntervalEnum interval = InstrumentHistoryIntervalEnum.Daily);
}
