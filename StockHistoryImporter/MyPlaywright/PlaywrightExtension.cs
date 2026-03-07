using Microsoft.Playwright;

namespace StockHistoryImporter.MyPlaywright;

internal static class PlaywrightExtension
{
    public static async Task PlaywrightClick(this IPage page, string selector)
    {
        await page.ClickAsync(selector, new PageClickOptions { Timeout = 2500 });
        //var element = page.Locator(selector);
        //await page.PlaywrightClick(element);
    }

    public static async Task PlaywrightClick(this IPage page, ILocator element)
    {
        try
        {
            if (await element.CountAsync() != 1)
            {
                element = element.First;
            }
            await element.ScrollIntoViewIfNeededAsync();

            var box = await element.BoundingBoxAsync();

            var rand = new Random();
            double targetX = box.X + box.Width * rand.NextDouble();
            double targetY = box.Y + box.Height * rand.NextDouble();

            // Simulate human-like curved path
            for (int i = 0; i < rand.Next(12, 24); i++)
            {
                double t = i / 20.0;
                float x = (float)(targetX + Math.Sin(t * Math.PI) * rand.Next(-4, 4));
                float y = (float)(targetY + Math.Cos(t * Math.PI) * rand.Next(-4, 4));

                await page.Mouse.MoveAsync(x, y);
                await Task.Delay(rand.Next(8, 20));
            }

            await page.Mouse.DownAsync();
            await Task.Delay(rand.Next(30, 120));
            await page.Mouse.UpAsync();
        }
        catch (Exception ex)
        {

        }
        return;

        try
        {
            // await element.ClickAsync(new LocatorClickOptions { Timeout = 2500 });
            await Task.Delay(Random.Shared.Next(800, 1300));
            if (await element.CountAsync() != 1)
            {
                element = element.First;
            }

            var box = await element.BoundingBoxAsync();
            if (box == null)
            {
                string html = await element.EvaluateAsync<string>("el => el.outerHTML");
                Console.WriteLine($"Element '{element.ToString()}' not found.\n{html}");
            }
            var x = box!.X + box.Width / 2 + Random.Shared.Next(-5, 5);
            var y = box.Y + box.Height / 2 + Random.Shared.Next(-2, 2);
            await page.Mouse.MoveAsync(x, y, new MouseMoveOptions { Steps = 10 });
            await page.Mouse.ClickAsync(x, y, new MouseClickOptions() { Delay = 4 });
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
        }
    }

    public static async Task HumanType(this IPage page, string selector, string text)
    {
        var rand = new Random();
        foreach (char c in text)
        {
            await page.TypeAsync(selector, c.ToString());
            await Task.Delay(rand.Next(80, 200));
        }
    }
}
