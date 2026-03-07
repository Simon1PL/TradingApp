using System.Net;

using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AzureFunctions;

public class GetStockInstruments
{
    private readonly ILogger _logger;
    private readonly IConfiguration _configuration;
    private static readonly string[] AllowedOrigins =
    [
        "https://simon1pl.github.io",
    ];

    public GetStockInstruments(ILoggerFactory loggerFactory, IConfiguration configuration)
    {
        _logger = loggerFactory.CreateLogger<GetStockInstruments>();
        _configuration = configuration;
    }

    [Function("StockInstruments")]
    public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = null)] HttpRequestData req)
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
            response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            response.Headers.Add("Access-Control-Allow-Credentials", "true");
            return response;
        }

        string? symbol = req.Query["symbol"];

        var accountKey = _configuration["AzureStorage:AccountKey"];
        var accountName = _configuration["AzureStorage:AccountName"];
        var containerName = _configuration["AzureStorage:ContainerName"];
        var endpointSuffix = _configuration["AzureStorage:EndpointSuffix"];
        var blobFileName = _configuration["AzureStorage:CryptoList"];
        string connectionString = $"DefaultEndpointsProtocol=https;AccountName={accountName};AccountKey={accountKey};EndpointSuffix={endpointSuffix}";
        var blobServiceClient = new Azure.Storage.Blobs.BlobServiceClient(connectionString);
        var blobContainerClient = blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = blobContainerClient.GetBlobClient(blobFileName);
        if (!await blobClient.ExistsAsync())
        {
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.WriteString($"Blob file '{blobFileName}' not found in container '{containerName}'.");
            return response;
        }

        var downloadInfo = await blobClient.DownloadAsync();
        using var reader = new StreamReader(downloadInfo.Value.Content);

        if (string.IsNullOrWhiteSpace(symbol))
        {
            var content = await reader.ReadToEndAsync();
            var instruments = content.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
            if (!instruments.Any())
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.WriteString($"Blob file '{blobFileName}' is empty.");
                return response;
            }

            await response.WriteAsJsonAsync(instruments);
        }

        do
        {
            var content = await reader.ReadLineAsync();
        }
        while (content != null && !content.StartsWith("Id,Symbol,Name,Slug,Rank"));

        var instrument = lines
            .Skip(1) // skip header line
            .Select(line => line.Split(','))
            .Where(parts => parts.Length >= 5 && parts[1].Equals(symbol, StringComparison.OrdinalIgnoreCase))
            .Select(parts => new { Id = parts[0], Symbol = parts[1], Name = parts[2], Slug = parts[3], Rank = parts[4] })
            .ToList();
        if (matchingInstruments.Count == 0)
        {
            response.StatusCode = HttpStatusCode.NotFound;
            response.WriteString($"No instrument found for symbol '{symbol}'.");
            return response;
        }

        response.StatusCode = HttpStatusCode.OK;
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        return response;
    }
}
