var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.TradingWebApp_Server>("tradingwebapp-server");

builder.Build().Run();
