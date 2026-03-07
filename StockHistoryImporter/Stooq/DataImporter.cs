using Azure;
using Microsoft.Playwright;
using StockHistoryImporter.MyPlaywright;
using System;
using System.Diagnostics;
using System.Net.Http.Headers;

namespace StockHistoryImporter.Stooq;

internal static class DataImporter
{
    private const string StooqMainPageUrl = "https://stooq.com/db/";
    private const string StooqSetFileContentUrl = $"{StooqMainPageUrl}c/";

    public static async Task ImportYesterdayUsingHttpRequests()
    {
        var handler = new HttpClientHandler();
        //handler.UseCookies = false; // we set cookies manually
        using var http = new HttpClient(handler);

        var request = new HttpRequestMessage(HttpMethod.Get, "https://stooq.com/q/l/s/i/?1764443750963");

        //request.Headers.Add("Cookie", cookieHeader);
        //request.Headers.UserAgent.Add(new ProductInfoHeaderValue("Mozilla", "5.0"));

        //Console.WriteLine("\nCalling the file URL with cookies...");

        //var response = await http.SendAsync(request);
        //response.EnsureSuccessStatusCode();
        //var imageBytes = await response.Content.ReadAsByteArrayAsync();

        //var result = RunEasyOcr(imageBytes);

        //await Task.Delay(2000);
        //request = new HttpRequestMessage(HttpMethod.Get,
        //    $"https://stooq.com/q/l/s/?t={result}");

        //request.Headers.Add("Cookie", cookieHeader);
        //request.Headers.UserAgent.Add(new ProductInfoHeaderValue("Mozilla", "5.0"));
        //response = await http.SendAsync(request);
        //response.EnsureSuccessStatusCode();
        //Console.WriteLine(await response.Content.ReadAsStringAsync());

        //var cookies = await context.CookiesAsync();
        string cookieHeader = ""; // string.Join("; ", cookies.Select(x => $"{x.Name}={x.Value}"));

        await Task.Delay(60000 * 3);

        await SendStooqSetFileContentRequest(http, cookieHeader);
        await SendStooqGetYesterdayDataRequest(http, cookieHeader);
    }

    public static async Task ImportUsingPlaywright(DateTimeOffset date)
    {
        var downloadDailyButtonText = date.ToString("MMdd") + "_d";
        Console.WriteLine($"Download button text: {downloadDailyButtonText}");
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

        try
        {
            await page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            await page.PlaywrightClick("text=Zgadzam się");
        }
        catch
        {
            // continue, cookies may be already accepted in the browser profile
        }

        await page.PlaywrightClick($"a:has-text(\"{downloadDailyButtonText}\")");
        await page.FillCaptcha();

        await page.PlaywrightClick("a:has-text(\"Setting Files Content\")");
        await page.PlaywrightClick("a:has-text(\"Select All\")");
        await page.EvaluateAsync("window.scrollBy(0, 1000)");
        await page.PlaywrightClick("#bs");
        await page.PlaywrightClick("input[value='Close']");
        await page.EvaluateAsync("window.scrollBy(0, -1000)");

        var download = await page.RunAndWaitForDownloadAsync(async () =>
        {
            await page.PlaywrightClick($"a:has-text(\"{downloadDailyButtonText}\")");
        });
        await download.SaveAsAsync("AaAaAa.txt");
        long sizeBytes = new FileInfo("AaAaAa.txt").Length;
        Console.WriteLine($"Downloaded file size: {sizeBytes} bytes");
        
        //if (sizeBytes < 2000 * 1024) // 2000 kB = 2,048,000 bytes
        //{
        //    var cookies = await context.CookiesAsync();
        //    string cookieHeader = string.Join("; ", cookies.Select(x => $"{x.Name}={x.Value}"));
        //    Console.WriteLine($"Cookies:\n{cookieHeader}");

        //    await browser.CloseAsync();

        //    await Task.Delay(3 * MinuteInMiliseconds);

        //    var handler = new HttpClientHandler();
        //    handler.UseCookies = false; // we set cookies manually
        //    using var http = new HttpClient(handler);

        //    await SendStooqSetFileContentRequest(http, cookieHeader);
        //    await SendStooqGetYesterdayDataRequest(http, cookieHeader);
        //}
    }

    private static async Task FillCaptcha(this IPage page, int maxRetries = 3)
    {
        var captchaElement = page.Locator("#cpt_cd img");
        try
        {
            await captchaElement.WaitForAsync(new LocatorWaitForOptions { Timeout = 1000 });
        }
        catch (TimeoutException)
        {
            return;
        }

        var imageBytes = await captchaElement.ScreenshotAsync();
        var readText = TextFromImageReader.ReadTextFromImage(imageBytes);
        await page.FillAsync("input[name='cpt_t']", readText);
        await page.PlaywrightClick("input[value='Approve']");
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

            await page.PlaywrightClick(page.GetByText("Change code"));
            await page.FillCaptcha(maxRetries - 1);
        }

        await page.PlaywrightClick(page.Locator("#cpt_2").Locator("a:has-text(\"Close\")"));
    }

    private static async Task SendStooqSetFileContentRequest(HttpClient http, string? cookieHeader = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, StooqSetFileContentUrl);
        request.Headers.Accept.ParseAdd("*/*");
        request.Headers.AcceptLanguage.ParseAdd("pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7");
        request.Headers.Connection.ParseAdd("keep-alive");
        request.Headers.Add("Origin", "https://stooq.com");
        request.Headers.Referrer = new Uri(StooqMainPageUrl);
        request.Headers.Add("Sec-Fetch-Dest", "empty");
        request.Headers.Add("Sec-Fetch-Mode", "cors");
        request.Headers.Add("Sec-Fetch-Site", "same-origin");
        request.Headers.Add("sec-ch-ua", "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"");
        request.Headers.Add("sec-ch-ua-mobile", "?0");
        request.Headers.Add("sec-ch-ua-platform", "\"Windows\"");
        request.Headers.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36");
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
        Console.WriteLine($"StooqSetFileContent response:\n{text}");
    }

    private static async Task SendStooqGetYesterdayDataRequest(HttpClient http, string? cookieHeader = null)
    {
        var now = DateTime.UtcNow;
        var dateString = string.Empty + now.Year + (now.Month + 1) + now.Day;
        var request = new HttpRequestMessage(HttpMethod.Get, $"https://stooq.com/db/d/?d={dateString}&t=d");
        request.Headers.Add("Cookie", cookieHeader);
        request.Headers.UserAgent.Add(new ProductInfoHeaderValue("Mozilla", "5.0"));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));
        var response = await http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        byte[] contentBytes = await response.Content.ReadAsByteArrayAsync();
        string filePath = @"C:\Users\sxz04011\Desktop\Trade\TradingApp\file.csv";
        await File.WriteAllBytesAsync(filePath, contentBytes);
        Console.WriteLine($"File for date {dateString} downloaded to {filePath}");
    }
}
