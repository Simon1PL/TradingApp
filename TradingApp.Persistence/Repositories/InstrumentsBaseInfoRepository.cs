namespace TradingApp.Persistence.Repositories;

using Trading.Domain.Models.Instruments;
using Trading.Domain.Repositories;
using TradingApp.Persistence.Data;

public class InstrumentsBaseInfoRepository : IInstrumentsBaseInfoRepository
{
    private readonly InstrumentsBaseInfoDbContext InstrumentsBaseInfoDb;

    public InstrumentsBaseInfoRepository(InstrumentsBaseInfoDbContext instrumentsBaseInfoDb)
    {
        InstrumentsBaseInfoDb = instrumentsBaseInfoDb;
    }

    public void Add(InstrumentBaseInfo instrumentBaseInfo)
    {
        InstrumentsBaseInfoDb.InstrumentsBaseInfo.Add(instrumentBaseInfo);
        InstrumentsBaseInfoDb.SaveChanges();
    }

    public IEnumerable<InstrumentBaseInfo> GetAll()
    {
        return InstrumentsBaseInfoDb.InstrumentsBaseInfo.ToList();
    }
}