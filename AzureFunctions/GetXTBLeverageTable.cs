using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml;
using Azure;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.VisualBasic;
using UglyToad.PdfPig;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Linq;

namespace AzureFunctions;

public class GetXTBLeverageTable
{
    private readonly ILogger _logger;
    private static readonly string[] AllowedOrigins =
    [
        "https://simon1pl.github.io",
    ];

    public GetXTBLeverageTable(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<GetTradingHistory>();
    }

    [Function("XTBLeverageTable")]
    public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "options", Route = null)] HttpRequestData req)
    {
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

        string pageUrl = "https://www.xtb.com/pl/specyfikacja-instrumentow/dokumenty";
        using var http = new HttpClient();
        string html = await http.GetStringAsync(pageUrl);
        var anchorMatches = Regex.Matches(html, @"<a\s+[^>]*href\s*=\s*[""']([^""']+)[""'][^>]*>(.*?)</a>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        var pdfUrl = anchorMatches
            .Select(x => new { Href = x.Groups[1].Value, Inner = x.Groups[2].Value })
            .Where(x => x.Inner.Contains("Tabela zabezpieczeñ rozliczeniowych", StringComparison.OrdinalIgnoreCase))
            .FirstOrDefault()?.Href;
        
        if (pdfUrl == null)
        {
            var error = $"No link 'Tabela zabezpieczeñ rozliczeniowych' found on {pageUrl}";
            _logger.LogInformation(error);
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(error);
            return response;
        }

        if (!pdfUrl.StartsWith("http"))
        {
            var baseUri = new Uri(pageUrl);
            pdfUrl = new Uri(baseUri, pdfUrl).ToString();
        }

        byte[] pdfBytes = await http.GetByteArrayAsync(pdfUrl);
        using var pdfDoc = PdfDocument.Open(new MemoryStream(pdfBytes));
        string fullText = "";
        foreach (var page in pdfDoc.GetPages())
        {
            var words = page.GetWords()
                            .ToList();

            double? lastY = null;
            foreach (var word in words)
            {
                var currentY = word.BoundingBox.Top;
                if (lastY != null)
                {
                    double yDiff = Math.Abs(currentY - lastY.Value);
                    if (yDiff > 2)
                    {
                        fullText = fullText.TrimEnd() + Environment.NewLine;
                    }
                    else
                    {
                        fullText += " ";
                    }
                }

                fullText += word.Text;
                lastY = currentY;
            }

            fullText += Environment.NewLine + Environment.NewLine;
        }

        var leverageTable = fullText
            .Split('\n')
            .Select(l => l.Trim())
            .Where(l => l.Length > 0)
            .ToList();

        await response.WriteAsJsonAsync(leverageTable);
        return response;
    }
}
