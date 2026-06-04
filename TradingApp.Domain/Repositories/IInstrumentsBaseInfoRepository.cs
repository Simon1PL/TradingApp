namespace Trading.Domain.Repositories;

using Trading.Domain.Models.Instruments;

public interface IInstrumentsBaseInfoRepository
{
    void Add(InstrumentBaseInfo instrumentBaseInfo);
    IEnumerable<InstrumentBaseInfo> GetAll();
}
