using System.Security.Cryptography;
using backend.DTOs;
using backend.Infrastructure;

namespace backend.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly PinataClient _pinataClient;

        public DocumentService(PinataClient pinataClient)
        {
            _pinataClient = pinataClient;
        }

        public async Task<UploadResultDto> ProcessDocumentAsync(IFormFile file)
        {
            // 1–2. ZAPIS DO TEMP
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
                    hash = Convert.ToHexString(hashBytes).ToLower();
                }

                // 4–5. PINATA → CID
                var cid = await _pinataClient.UploadAsync(tempPath, file.FileName);

                // 7. RESPONSE
                return new UploadResultDto
                {
                    Hash = hash,
                    Cid = cid
                };
            }
            finally
            {
                // 6. CLEANUP
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
        }
    }
}