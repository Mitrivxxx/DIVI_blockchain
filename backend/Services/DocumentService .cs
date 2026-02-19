using System.Security.Cryptography;
using backend.DTOs;
using backend.Infrastructure;

namespace backend.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly PinataClient _pinataClient;
        private readonly BlockchainService _blockchainService;

        public DocumentService(PinataClient pinataClient, BlockchainService blockchainService)
        {
            _pinataClient = pinataClient;
            _blockchainService = blockchainService;
        }

        public async Task<UploadResultDto> ProcessDocumentAsync(IFormFile file, string documentType, string owner)
        {
            var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());

            await using (var fs = new FileStream(tempPath, FileMode.Create))
            {
                await file.CopyToAsync(fs);
            }

            try
            {
                // 3. SHA-256
                string hash;
                await using (var stream = File.OpenRead(tempPath))
                {
                    using var sha256 = SHA256.Create();
                    var hashBytes = await sha256.ComputeHashAsync(stream);
                        hash = "0x" + Convert.ToHexString(hashBytes).ToLower();
                }

                // 4–5. PINATA → CID
                var cid = await _pinataClient.UploadAsync(tempPath, file.FileName);

                // Konwersja documentType (string) do bytes32

                // 6. Zapis do blockchaina (przekazujemy oryginalny documentType, konwersja w BlockchainService)
                await _blockchainService.IssueDocumentAsync(hash, cid, owner, documentType);

                return new UploadResultDto
                {
                    Hash = hash,
                    Cid = cid
                };
            }
            finally
            {
                // 7. CLEANUP
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
        }

        // Konwersja string do bytes32 (32 bajty, padding zerami)
        private static string StringToBytes32(string str)
        {
            if (string.IsNullOrEmpty(str)) return "0x" + new string('0', 64);
            var bytes = System.Text.Encoding.UTF8.GetBytes(str);
            if (bytes.Length > 32)
                throw new ArgumentException("documentType too long for bytes32");
            var padded = new byte[32];
            Array.Copy(bytes, padded, bytes.Length);
            return "0x" + BitConverter.ToString(padded).Replace("-", string.Empty).ToLower();
        }
    }
}