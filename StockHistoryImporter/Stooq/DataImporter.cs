namespace StockHistoryImporter.Stooq;

using Microsoft.Playwright;
using StockHistoryImporter.MyPlaywright;
using System.Diagnostics;

internal static class DataImporter
{
    private const string StooqMainPageUrl = "https://stooq.com/db/";
    private const string StooqSetFileContentUrl = $"{StooqMainPageUrl}c/";
    private const int DefaultClickTimeout = 2000;

    public static async Task ImportUsingPlaywright(DateTimeOffset date, string filePath)
    {
        var chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
        var userDataDir = @"C:\temp\chrome-profile";
        var processInfo = new ProcessStartInfo
        {
            FileName = chromePath,
            Arguments = $"--remote-debugging-port=9222 --user-data-dir=\"{userDataDir}\" --start-maximized",
            UseShellExecute = true
        };

        Process.Start(processInfo);
        using var playwright = await Playwright.CreateAsync();
        var browser = await playwright.Chromium.ConnectOverCDPAsync("http://localhost:9222");
        var context = browser.Contexts[0];
        var page = await context.NewPageAsync();

        await page.GotoAsync(StooqMainPageUrl);
        await AcceptCookies(page);
        var downloadDailyButtonText = date.ToString("MMdd") + "_d";
        Console.WriteLine($"Clicking button with text '{downloadDailyButtonText}'.");
        await page.ClickAsync($"a:has-text(\"{downloadDailyButtonText}\")", new PageClickOptions { Timeout = DefaultClickTimeout });
        await page.FillCaptcha();
        var cookies = await context.CookiesAsync();
        var cookieHeader = string.Join("; ", cookies.Select(x => $"{x.Name}={x.Value}"));
        await browser.CloseAsync();

        using var http = new HttpClient();
        await SendStooqSetFileContentRequest(http, cookieHeader);
        await SendStooqGetDataRequest(date, filePath, http, cookieHeader);
    }

    private static async Task AcceptCookies(IPage page)
    {
        try
        {
            await page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            await page.ClickAsync("text=Zgadzam się", new PageClickOptions { Timeout = DefaultClickTimeout });
        }
        catch (TimeoutException)
        {
            // continue, cookies may be already accepted in the browser profile
        }
    }

    private static async Task FillCaptcha(this IPage page, int maxRetries = 3)
    {
        var captchaElement = page.Locator("#cpt_cd img");
        try
        {
            await captchaElement.WaitForAsync(new LocatorWaitForOptions { Timeout = DefaultClickTimeout });
        }
        catch (TimeoutException)
        {
            return;
        }

        var imageBytes = await captchaElement.ScreenshotAsync();
        var readText = TextFromImageReader.ReadTextFromImage(imageBytes);
        await page.FillAsync("input[name='cpt_t']", readText);
        await page.ClickAsync("input[value='Approve']", new PageClickOptions { Timeout = DefaultClickTimeout });
        var successTask = page.GetByText("Authorization successful!").WaitForAsync();
        var errorTask = page.GetByText("Wrong code! Try again").WaitForAsync();
        await Task.WhenAny(successTask, errorTask);
        if (errorTask.IsCompletedSuccessfully)
        {
            if (maxRetries == 0)
            {
                var imagePath = Path.GetFullPath($"captcha_{DateTime.UtcNow:yyyy-MM-dd_HH-mm-ss}.png");
                await File.WriteAllBytesAsync(imagePath, imageBytes);
                throw new Exception($"Captcha filling failed. Read text '{readText}', image '{imagePath}'.");
            }

            await page.ClickAsync("Change code", new PageClickOptions { Timeout = DefaultClickTimeout });
            await page.FillCaptcha(maxRetries - 1);
        }

        await page.Locator("#cpt_2").Locator("a:has-text(\"Close\")").ClickAsync(new LocatorClickOptions { Timeout = DefaultClickTimeout });
    }

    private static async Task SendStooqSetFileContentRequest(HttpClient http, string? cookieHeader = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, StooqSetFileContentUrl);
        if (cookieHeader != null) request.Headers.Add("Cookie", cookieHeader);
        var content = new FormUrlEncodedContent([
            new KeyValuePair<string,string>("d", "53 59 1 3 39 52 25 70 71 26 28 69 27 18 23 16 38 34 35 33 36 32 37 79 77 75 78 74 80 73 76 66 55 57 65 54 56 58 68 67 22 17 20 21 19 10 13 11 8 15 4 102 9 7 14 6 64 30 40 94 98 84 41 42 82 62 44 45 43 99 81 100 85 95 51 46 101 96 92 61 88 72 97 47 93 90 63 91 60 87 86 89 48 83 49 50"),
            new KeyValuePair<string,string>("h", "1 3"),
            new KeyValuePair<string,string>("5", "1 3")
        ]);

        request.Content = content;
        var response = await http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var bytes = await response.Content.ReadAsByteArrayAsync();
        string text = System.Text.Encoding.UTF8.GetString(bytes);
        Console.WriteLine($"Stooq SetFileContent response: '{text}'");
    }

    private static async Task SendStooqGetDataRequest(DateTimeOffset date, string filePath, HttpClient http, string? cookieHeader = null)
    {
        var dateString = string.Empty + date.Year + (date.Month + 1) + date.Day;
        var request = new HttpRequestMessage(HttpMethod.Get, $"https://stooq.com/db/d/?d={dateString}&t=d");
        request.Headers.Add("Cookie", cookieHeader);
        var response = await http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        byte[] contentBytes = await response.Content.ReadAsByteArrayAsync();
        await File.WriteAllBytesAsync(filePath, contentBytes);
        Console.WriteLine($"File for date '{date::yyyy-MM-dd}' downloaded to '{filePath}' (size {contentBytes.Length}).");
    }
}
