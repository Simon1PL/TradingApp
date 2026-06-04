namespace TradingApp.Persistence.Data;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Trading.Domain.Models.Instruments;
using TradingApp.Persistence.Constants;

public class InstrumentsBaseInfoDbContext : DbContext
{
    public InstrumentsBaseInfoDbContext(DbContextOptions<InstrumentsBaseInfoDbContext> options)
        : base(options)
    {
    }

    public DbSet<InstrumentBaseInfo> InstrumentsBaseInfo => Set<InstrumentBaseInfo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InstrumentBaseInfo>(entity =>
        {
            entity.HasKey(x => x.Id);
        });
    }
}


// This factory is used for design-time services like migrations. It allows the tools to create an instance of the DbContext without having to rely on the application's dependency injection setup.
public class InstrumentsBaseInfoDbContextFactory
    : IDesignTimeDbContextFactory<InstrumentsBaseInfoDbContext>
{
    public InstrumentsBaseInfoDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<InstrumentsBaseInfoDbContext>();
        optionsBuilder.UseSqlite($"Data Source={SqlLiteDbPaths.InstrumentsBaseInfoDBPath}");
        return new InstrumentsBaseInfoDbContext(optionsBuilder.Options);
    }
}