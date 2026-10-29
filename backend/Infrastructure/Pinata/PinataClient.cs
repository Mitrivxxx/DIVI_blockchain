using System.Net.Http.Headers;
using System.Text.Json;
using backend.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace backend.Infrastructure
{
    public class PinataClient
    {
        private readonly HttpClient _httpClient;
        private readonly PinataOptions _options;

        public PinataClient(HttpClient httpClient, IOptions<PinataOptions> options)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _httpClient.BaseAddress = new Uri(_options.BaseUrl);
            var jwt = Environment.GetEnvironmentVariable("PINATA_JWT");
            if (string.IsNullOrWhiteSpace(jwt))
            {
                throw new InvalidOperationException("Zmienna środowiskowa PINATA_JWT nie została ustawiona lub jest pusta.");
            }
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", jwt);
        }

        public async Task<string> UploadAsync(string filePath, string fileName)
        {
            try
            {
                using var content = new MultipartFormDataContent();
                using var fileStream = new FileStream(
                    filePath,
                    FileMode.Open,
                    FileAccess.Read,
                    FileShare.Read,
                    4096,
                    FileOptions.Asynchronous);

                content.Add(new StreamContent(fileStream), "file", fileName);

                var response = await _httpClient.PostAsync(_options.PinFileEndpoint, content);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                return doc.RootElement.GetProperty("IpfsHash").GetString()!;
            }
            catch (Exception ex)
            {
                // Możesz podmienić na własny system logowania
                Console.Error.WriteLine($"Błąd podczas uploadu do Pinata: {ex.Message}\n{ex.StackTrace}");
                throw new ApplicationException("Wystąpił błąd podczas uploadu pliku do Pinata.", ex);
            }
        }

        public async Task<byte[]> DownloadAsync(string cid, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(cid))
            {
                throw new ArgumentException("cid is required", nameof(cid));
            }

            var gateway = _options.GatewayUrl?.Trim();
            if (string.IsNullOrWhiteSpace(gateway))
            {
                gateway = "https://gateway.pinata.cloud/ipfs/";
            }

            if (!gateway.EndsWith('/'))
            {
                gateway += "/";
            }

            var url = $"{gateway}{cid.Trim()}";
            // Separate client: Pinata API HttpClient always sends JWT, which breaks public gateways.
            using var gatewayClient = new HttpClient { Timeout = TimeSpan.FromMinutes(2) };
            using var response = await gatewayClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsByteArrayAsync(cancellationToken);
        }
    }
}