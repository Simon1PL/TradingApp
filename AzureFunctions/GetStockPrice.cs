using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace AzureFunctions;

public class GetStockPrice
{
    private readonly ILogger _logger;
    private static readonly string[] AllowedOrigins =
    [
        "https://simon1pl.github.io",
    ];

    public GetStockPrice(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<GetStockPrice>();
    }

    [Function("StockPrice")]
    public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "options", Route = null)] HttpRequestData req)
    {
        _logger.LogInformation("C# HTTP trigger function processed a request.");
        var response = req.CreateResponse(HttpStatusCode.OK);

        req.Headers.TryGetValues("Origin", out var headers);
        string? origin = headers?.FirstOrDefault();
        // if (AllowedOrigins.Contains(origin))
        // {
        response.Headers.Add("Access-Control-Allow-Origin", origin);
        // }

        if (req.Method == "OPTIONS")
        {
            response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            response.Headers.Add("Access-Control-Allow-Credentials", "true");
            return response;
        }

        string? name = req.Query["name"];

        // 
        string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
        if (!string.IsNullOrWhiteSpace(requestBody))
        {
            dynamic? data = JsonSerializer.Deserialize<dynamic>(requestBody);
            name ??= data?.name;
        }

        string responseMessage = string.IsNullOrEmpty(name)
            ? "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response."
            : $"Hello, {name}. This HTTP triggered function executed successfully.";

        response.Headers.Add("Content-Type", "text/plain; charset=utf-8");

        response.WriteString(responseMessage);
        return response;
    }
}
