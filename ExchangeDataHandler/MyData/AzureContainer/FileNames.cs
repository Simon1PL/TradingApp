namespace ExchangeDataHandler.MyData.AzureContainer;

internal static class FileNames
{
    private const string CryptoDir = "Crypto/";

    public const string CryptoList = $"{CryptoDir}CryptoList.csv";

    public static string CryptoHistoryData(string symbol) => $"{CryptoDir}/History/{symbol}"; // Be careful, symbol must be unique
}
