using System.Net.Http.Headers;
using System.Text.Json;

namespace backend.Infrastructure
{
    public class PinataClient
    {
        private readonly HttpClient _httpClient;

        public PinataClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("https://api.pinata.cloud/");
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", Environment.GetEnvironmentVariable("PINATA_JWT"));
        }

        public async Task<string> UploadAsync(string filePath, string fileName)
        {
            using var content = new MultipartFormDataContent();
            using var fileStream = File.OpenRead(filePath);

            content.Add(new StreamContent(fileStream), "file", fileName);

            var response = await _httpClient.PostAsync("pinning/pinFileToIPFS", content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            return doc.RootElement.GetProperty("IpfsHash").GetString()!;
        }
    }
}