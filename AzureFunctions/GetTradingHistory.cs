using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Linq;

namespace AzureFunctions
{
    public static class GetTradingHistory
    {
        private static readonly string[] AllowedOrigins = new string[]
        {
            "https://127.0.0.1:4200",
            "https://simon1pl.github.io",
            "*" // TEMPORARY!
        };

        [FunctionName("TradingHistory")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "options", Route = null)] HttpRequest req,
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            if (req.Method == "OPTIONS")
            {
                string origin = req.Headers["Origin"];
                if (AllowedOrigins.Contains(origin))
                {
                    req.HttpContext.Response.Headers.Add("Access-Control-Allow-Origin", origin);
                }

                req.HttpContext.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                req.HttpContext.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
                req.HttpContext.Response.Headers.Add("Access-Control-Allow-Credentials", "true");
                return new OkResult();
            }

            string name = req.Query["name"];

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);
            name = name ?? data?.name;

            string responseMessage = string.IsNullOrEmpty(name)
                ? "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response."
                : $"Hello, {name}. This HTTP triggered function executed successfully.";

            return new OkObjectResult(responseMessage);
        }
    }
}
