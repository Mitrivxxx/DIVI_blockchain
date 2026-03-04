

using System.Security.Cryptography;
using backend.DTOs;
using backend.Services.Blockchain;
using Microsoft.AspNetCore.Http;

namespace backend.Services.DocumentVerification
{
    public class DocumentVerificationService: IDocumentVerification
    {
        private readonly IBlockchainService _blockchainService;

        public DocumentVerificationService(IBlockchainService blockchainService)
        {
            _blockchainService = blockchainService;
        }

        public async Task<DocumentVerificationResultDto> VerifyDocumentAsync(IFormFile file)
        {
            if (file == null)
            {
                throw new ArgumentNullException(nameof(file));
            }

            if (file.Length == 0)
            {
                throw new ArgumentException("file is empty", nameof(file));
            }

            string hash;
            await using (var stream = file.OpenReadStream())
            {
                using var sha256 = SHA256.Create();
                var hashBytes = await sha256.ComputeHashAsync(stream);
                hash = "0x" + Convert.ToHexString(hashBytes).ToLower();
            }

            var existsInBlockchain = await _blockchainService.VerifyDocumentAsync(hash);

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