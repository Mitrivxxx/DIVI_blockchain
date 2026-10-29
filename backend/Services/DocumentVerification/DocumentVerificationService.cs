using System.Security.Cryptography;
using backend.DTOs;
using backend.Services.Blockchain;
using backend.Services.Documents;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace backend.Services.DocumentVerification
{
    public class DocumentVerificationService : IDocumentVerification
    {
        private const byte StatusConfirmed = 1;
        private const byte StatusRevoked = 2;

        private readonly IBlockchainService _blockchainService;
        private readonly IDocumentService _documentService;
        private readonly ILogger<DocumentVerificationService> _logger;

        public DocumentVerificationService(
            IBlockchainService blockchainService,
            IDocumentService documentService,
            ILogger<DocumentVerificationService> logger)
        {
            _blockchainService = blockchainService;
            _documentService = documentService;
            _logger = logger;
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

            _logger.LogDebug("VerifyDocumentAsync computed SHA-256 hash: {Hash}", hash);

            var networkName = await _blockchainService.GetNetworkNameAsync();
            var stored = await _documentService.GetByHashAsync(hash);

            byte? status = stored?.Status;
            if (status is null)
            {
                if (await _blockchainService.DocumentExistsAsync(hash))
                {
                    status = await _blockchainService.GetDocumentStatusAsync(hash);
                }
            }

            var isRevoked = status == StatusRevoked;
            var isAuthentic = status == StatusConfirmed;

            BlockchainTransactionInfoDto? blockchainInfo = null;
            if (status is not null)
            {
                if (stored is not null && !string.IsNullOrWhiteSpace(stored.TxHash))
                {
                    blockchainInfo = new BlockchainTransactionInfoDto
                    {
                        TransactionHash = stored.TxHash,
                        BlockNumber = stored.BlockNumber,
                        BlockTimestamp = stored.IssuedAt,
                        NetworkName = networkName
                    };
                }
                else
                {
                    blockchainInfo = await _blockchainService.GetDocumentBlockchainInfoAsync(hash);
                    if (blockchainInfo is not null)
                    {
                        blockchainInfo.NetworkName = networkName;
                    }
                }
            }

            var message = status switch
            {
                null => "Dokument nie jest autentyczny (hash nie istnieje w blockchain).",
                StatusRevoked => "Dokument został unieważniony (revoked) — istnieje w rejestrze, ale nie jest ważny.",
                StatusConfirmed => "Dokument jest autentyczny (status Confirmed w blockchain).",
                _ => "Dokument istnieje, ale nie ma statusu Confirmed."
            };

            return new DocumentVerificationResultDto
            {
                Hash = hash,
                IsAuthentic = isAuthentic,
                IsRevoked = isRevoked,
                Status = status,
                Message = message,
                TransactionHash = blockchainInfo?.TransactionHash,
                BlockNumber = blockchainInfo?.BlockNumber,
                BlockTimestamp = blockchainInfo?.BlockTimestamp,
                NetworkName = blockchainInfo?.NetworkName ?? networkName,
                IssuerAddress = stored?.Issuer,
                IssuedByMemberId = stored?.IssuedByMemberId,
                IssuerDisplayName = stored?.IssuerDisplayName,
            };
        }
    }
}
