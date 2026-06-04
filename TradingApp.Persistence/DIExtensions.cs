using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Trading.Domain.Repositories;
using TradingApp.Persistence.Constants;
using TradingApp.Persistence.Data;
using TradingApp.Persistence.Repositories;

namespace TradingApp.Persistence;

public static class DIExtensions
{
    public static IServiceCollection AddInstrumentsPersistenceAndApplyMigrations(
        this IServiceCollection services,
        string databasePath = SqlLiteDbPaths.InstrumentsBaseInfoDBPath)
    {
        services.AddDbContext<InstrumentsBaseInfoDbContext>(
            options => options.UseSqlite(
                $"Data Source={databasePath}"));

        services.AddScoped<IInstrumentsBaseInfoRepository, InstrumentsBaseInfoRepository>();

        var options = new DbContextOptionsBuilder<InstrumentsBaseInfoDbContext>()
            .UseSqlite($"Data Source={databasePath}")
            .Options;

        using var instrumentsBaseInfoDb = new InstrumentsBaseInfoDbContext(options);
        //instrumentsBaseInfoDb.Database.EnsureCreated();
        instrumentsBaseInfoDb.Database.Migrate();

        return services;
    }
}
