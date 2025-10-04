using Microsoft.Extensions.Configuration;
using Azure.Storage.Blobs;

namespace StockHistoryImporter;

internal class AzureBlobUploader
{
    private readonly IConfiguration _configuration;

    public AzureBlobUploader(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task UploadFileToGoogleDrive(string filePath, string mimeType)
    {
        var accountKey = _configuration["AzureStorage:AccountKey"];
        var accountName = _configuration["AzureStorage:AccountName"] ?? "storagetradingapp1";
        var containerName = _configuration["AzureStorage:ContainerName"] ?? "stockhistory";
        var endpointSuffix = _configuration["AzureStorage:EndpointSuffix"] ?? "core.windows.net";
        string connectionString = $"DefaultEndpointsProtocol=https;AccountName={accountName};AccountKey={accountKey};EndpointSuffix={endpointSuffix}";
        string blobName = Path.GetFileName(filePath);

        BlobServiceClient blobServiceClient = new BlobServiceClient(connectionString);
        BlobContainerClient containerClient = blobServiceClient.GetBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.GetBlobClient(blobName);
        using FileStream uploadFileStream = File.OpenRead(filePath);
        await blobClient.UploadAsync(uploadFileStream, overwrite: true);
        uploadFileStream.Close();

        Console.WriteLine($"File uploaded to Azure Blob Storage as: {blobName}");

        // Google is not working as we can not upload files to my drive, only to shared drives
        // Need googleKey.json file from Google Cloud Console and folderId from Google Drive
        //var googleKeyFilePath = "Files/googleKey.json";
        //var folderId = "1kZxsIFizFrJ-Q1LZR_O8br1Lj_m4Wuar";
        //GoogleCredential credential;
        //using (var stream = new FileStream(googleKeyFilePath, FileMode.Open, FileAccess.Read))
        //{
        //    credential = GoogleCredential.FromStream(stream).CreateScoped(DriveService.Scope.DriveFile);
        //}

        //var service = new DriveService(new BaseClientService.Initializer()
        //{
        //    HttpClientInitializer = credential,
        //    ApplicationName = "TradingApp",
        //});

        //var fileMetadata = new Google.Apis.Drive.v3.Data.File()
        //{
        //    Name = Path.GetFileName(filePath),
        //};

        //using var fileStream = new FileStream(filePath, FileMode.Open);
        //var request = service.Files.Create(fileMetadata, fileStream, mimeType);
        //request.Fields = "id";
        //request.SupportsAllDrives = true;
        //var progress = await request.UploadAsync();

        //if (progress.Status == Google.Apis.Upload.UploadStatus.Completed)
        //{
        //    var file = request.ResponseBody;
        //    Console.WriteLine($"Upload complete! File ID: {file.Id}");
        //}
        //else
        //{
        //    Console.WriteLine($"Upload failed: {progress.Exception}");
        //}
    }
}
