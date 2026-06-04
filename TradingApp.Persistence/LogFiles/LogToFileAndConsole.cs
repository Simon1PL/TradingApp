namespace TradingApp.Persistence.LogFiles;

public static class LogToFileAndConsole
{
    private static readonly string LogFilePath = Path.Combine("C:\\Users\\sxz04011\\Desktop\\Trade\\TradingApp\\Database\\Logs", $"{AppDomain.CurrentDomain.FriendlyName}_{DateTimeOffset.Now:yyyy-MM-dd}.log");

    public static void Log(string message, ConsoleColor? color = null)
    {
        if (color.HasValue)
        {
            var original = Console.ForegroundColor;
            Console.ForegroundColor = color.Value;
            Console.WriteLine(message);
            Console.ForegroundColor = original;
        }
        else
        {
            Console.WriteLine(message);
        }

        File.AppendAllText(LogFilePath, $"[{DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss}][{color}] {message}{Environment.NewLine}");
    }

    public static string GetLogFilePath()
    {
        return LogFilePath;
    }
}
