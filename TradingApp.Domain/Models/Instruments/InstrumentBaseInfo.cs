using Trading.Domain.Enums;

namespace Trading.Domain.Models.Instruments;

public record InstrumentBaseInfo(Guid Id, string Ticker, string Name, Country Country, string Exchange, InstrumentType Type);