using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Azure.Functions.Worker;
using System.Text.Json;

namespace AzureFunctions
{
    public static class GetTradingHistory
    {
        private static readonly string[] AllowedOrigins =
        [
            "https://simon1pl.github.io",
        ];

        [Function("TradingHistory")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "options", Route = null)] HttpRequest req,
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            string? origin = req.Headers["Origin"];
            // if (AllowedOrigins.Contains(origin))
            // {
            req.HttpContext.Response.Headers.Append("Access-Control-Allow-Origin", origin);
            // }

            if (req.Method == "OPTIONS")
            {
                req.HttpContext.Response.Headers.Append("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                req.HttpContext.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type, Authorization");
                req.HttpContext.Response.Headers.Append("Access-Control-Allow-Credentials", "true");
                return new OkResult();
            }

            string? name = req.Query["name"];

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic? data = JsonSerializer.Deserialize<dynamic>(requestBody);
            name ??= data?.name;

            string responseMessage = string.IsNullOrEmpty(name)
                ? "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response."
                : $"Hello, {name}. This HTTP triggered function executed successfully.";

            return new OkObjectResult(responseMessage);
        }
    }
}
