

using System.Security.Cryptography;
using backend.DTOs;
using backend.Services.Blockchain;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace backend.Services.DocumentVerification
{
    public class DocumentVerificationService: IDocumentVerification
    {
        private readonly IBlockchainService _blockchainService;
        private readonly ILogger<DocumentVerificationService> _logger;

        public DocumentVerificationService(
            IBlockchainService blockchainService,
            ILogger<DocumentVerificationService> logger)
        {
            _blockchainService = blockchainService;
            _logger = logger;
        }

        public async Task<DocumentVerificationResultDto> VerifyDocumentAsync(IFormFile file)
        {
            _logger.LogDebug(
                "VerifyDocumentAsync started. FileName: {FileName}, ContentType: {ContentType}, SizeBytes: {SizeBytes}",
                file?.FileName,
                file?.ContentType,
                file?.Length);

            if (file == null)
            {
                _logger.LogDebug("VerifyDocumentAsync validation failed: file is null.");
                throw new ArgumentNullException(nameof(file));
            }

            if (file.Length == 0)
            {
                _logger.LogDebug("VerifyDocumentAsync validation failed: file is empty.");
                throw new ArgumentException("file is empty", nameof(file));
            }

            string hash;
            await using (var stream = file.OpenReadStream())
            {
                using var sha256 = SHA256.Create();
                var hashBytes = await sha256.ComputeHashAsync(stream);
                hash = "0x" + Convert.ToHexString(hashBytes).ToLower();
            }

            _logger.LogDebug("VerifyDocumentAsync computed SHA-256 hash: {Hash}", hash);

            var existsInBlockchain = await _blockchainService.VerifyDocumentAsync(hash);

            _logger.LogDebug(
                "VerifyDocumentAsync blockchain verification completed. Hash: {Hash}, ExistsInBlockchain: {ExistsInBlockchain}",
                hash,
                existsInBlockchain);

            return new DocumentVerificationResultDto
            {
                Hash = hash,
                IsAuthentic = existsInBlockchain,
                Message = existsInBlockchain
                    ? "Dokument jest autentyczny (hash istnieje w blockchain)."
                    : "Dokument nie jest autentyczny (hash nie istnieje w blockchain)."
            };
        }
        
    }
}