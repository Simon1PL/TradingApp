namespace ExchangeDataHandler.MyData.AzureContainer;

using Azure.Storage.Blobs;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Trading.Domain.Models.Crypto;
using Trading.Domain.Models.Instruments;

public class FileSaver(IConfiguration configuration) : IDataWriter
{
    public Task SaveCryptoDetailsList(IEnumerable<CryptoDetails> cryptoDetailsList, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public async Task SaveCryptoList(IEnumerable<Crypto> cryptoList, CancellationToken cancellationToken)
    {
        var csvLines = new List<string>(cryptoList.Count() + 1) { "Symbol,Name" };
        foreach (var crypto in cryptoList)
        {
            csvLines.Add($"{crypto.Symbol},{crypto.Name}");
        }
        var csvContent = string.Join("\n", csvLines);
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));
        await UploadFile(stream, FileNames.CryptoList, cancellationToken);
    }

    public Task SaveHistory(IEnumerable<PriceHistory> priceHistoryList, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task SaveStockList(IEnumerable<Instrument> instrumentList, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    private async Task UploadFile(Stream fileData, string blobPath, CancellationToken cancellationToken)
    {
        var accountKey = configuration["AzureStorage:AccountKey"];
        var accountName = configuration["AzureStorage:AccountName"];
        var containerName = configuration["AzureStorage:ContainerName"];
        var endpointSuffix = configuration["AzureStorage:EndpointSuffix"];
        var connectionString = $"DefaultEndpointsProtocol=https;AccountName={accountName};AccountKey={accountKey};EndpointSuffix={endpointSuffix}";
        var blobName = blobPath;

        var blobServiceClient = new BlobServiceClient(connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobName);
        await blobClient.UploadAsync(fileData, overwrite: true, cancellationToken);

        Console.WriteLine($"File uploaded to Azure Blob Storage as: {blobName}");
    }
}
