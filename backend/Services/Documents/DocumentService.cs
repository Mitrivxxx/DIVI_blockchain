using System.Security.Cryptography;
using backend.DTOs;
using backend.Infrastructure;
using backend.Services.Blockchain;

namespace backend.Services.Documents
{
	public class DocumentService : IDocumentService
	  {
        private readonly PinataClient _pinataClient;
        private readonly IBlockchainService _blockchainService;

        public DocumentService(PinataClient pinataClient, IBlockchainService blockchainService)
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
                // 1. SHA-256
                string hash;
                await using (var stream = File.OpenRead(tempPath))
                {
                    using var sha256 = SHA256.Create();
                    var hashBytes = await sha256.ComputeHashAsync(stream);
                    hash = "0x" + Convert.ToHexString(hashBytes).ToLower();
                }

                // 2. Sprawdź czy dokument już istnieje w blockchain
                var exists = await _blockchainService.VerifyDocumentAsync(hash);
                if (exists)
                {
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = string.Empty,
                        Message = "Taki dokument już istnieje w blockchain, nie możesz go wrzucić jeszcze raz."
                    };
                }

                // 3. Upload do Pinata → CID
                string cid;
                try
                {
                    cid = await _pinataClient.UploadAsync(tempPath, file.FileName);
                }
                catch (Exception ex)
                {
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = string.Empty,
                        Message = $"Błąd uploadu do Pinata: {ex.Message}"
                    };
                }

                // 4. Zapis do blockchaina (status Pending, potem Confirmed po sukcesie)
                try
                {
                    // Załóżmy, że IssueDocumentAsync ustawia status Pending, a potem Confirmed
                    await _blockchainService.IssueDocumentAsync(hash, cid, owner, documentType);
                }
                catch (Exception ex)
                {
                    // Plik jest już w Pinata, ale nie ma wpisu w blockchain
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = cid,
                        Message = $"Błąd zapisu do blockchain: {ex.Message} (plik jest już w Pinata)"
                    };
                }

                return new UploadResultDto
                {
                    Hash = hash,
                    Cid = cid,
                    Message = "Dokument został zapisany w Pinata i blockchain (Confirmed)."
                };
            }
            finally
            {
                // 5. CLEANUP
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