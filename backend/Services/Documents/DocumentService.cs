using System.Security.Cryptography;
using backend.Data;
using backend.DTOs;
using backend.Infrastructure;
using backend.Models;
using backend.Services.Blockchain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nethereum.Util;

namespace backend.Services.Documents
{
	public class DocumentService : IDocumentService
	  {
        private const byte StatusConfirmed = 1;
        private const byte StatusRevoked = 2;

        private readonly PinataClient _pinataClient;
        private readonly IBlockchainService _blockchainService;
        private readonly AppDbContext _db;
        private readonly ILogger<DocumentService> _logger;

        public DocumentService(
            PinataClient pinataClient,
            IBlockchainService blockchainService,
            AppDbContext db,
            ILogger<DocumentService> logger)
        {
            _pinataClient = pinataClient;
            _blockchainService = blockchainService;
            _db = db;
            _logger = logger;
        }

        public async Task<UploadResultDto> ProcessDocumentAsync(
            IFormFile file,
            string documentType,
            string owner,
            int? issuedByMemberId = null)
        {
            var uploadFile = file ?? throw new ArgumentNullException(nameof(file));

            _logger.LogDebug(
                "ProcessDocumentAsync started. FileName: {FileName}, ContentType: {ContentType}, SizeBytes: {SizeBytes}, DocumentType: {DocumentType}, Owner: {Owner}",
                uploadFile.FileName,
                uploadFile.ContentType,
                uploadFile.Length,
                documentType,
                owner);

            owner = owner?.Trim() ?? string.Empty;

            byte documentTypeValue;
            try
            {
                documentTypeValue = ParseDocumentType(documentType);
                _logger.LogDebug("Parsed document type value: {DocumentTypeValue}", documentTypeValue);
            }
            catch (ArgumentException ex)
            {
                _logger.LogDebug(ex, "Document type parsing failed. RawDocumentType: {DocumentType}", documentType);
                return new UploadResultDto
                {
                    Hash = string.Empty,
                    Cid = string.Empty,
                    Message = ex.Message
                };
            }

            if (!AddressUtil.Current.IsValidEthereumAddressHexFormat(owner))
            {
                _logger.LogDebug("Owner validation failed. Owner: {Owner}", owner);
                return new UploadResultDto
                {
                    Hash = string.Empty,
                    Cid = string.Empty,
                    Message = "Niepoprawny adres właściciela. Podaj poprawny adres Ethereum (0x...)."
                };
            }

            var normalizedOwner = owner.ToLowerInvariant();

            var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            _logger.LogDebug("Temporary file created for upload pipeline. TempPath: {TempPath}", tempPath);

            await using (var fs = new FileStream(tempPath, FileMode.Create))
            {
                await uploadFile.CopyToAsync(fs);
            }

            try
            {
                string hash;
                await using (var stream = File.OpenRead(tempPath))
                {
                    using var sha256 = SHA256.Create();
                    var hashBytes = await sha256.ComputeHashAsync(stream);
                    hash = "0x" + Convert.ToHexString(hashBytes).ToLower();
                }

                _logger.LogDebug("Computed SHA-256 hash for uploaded file. Hash: {Hash}", hash);

                if (await _db.Documents.AsNoTracking().AnyAsync(d => d.Hash == hash))
                {
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = string.Empty,
                        Message = "Taki dokument już istnieje w bazie, nie możesz go wrzucić jeszcze raz."
                    };
                }

                var exists = await _blockchainService.VerifyDocumentAsync(hash);
                _logger.LogDebug("Blockchain duplicate check completed. Hash: {Hash}, Exists: {Exists}", hash, exists);
                if (exists)
                {
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = string.Empty,
                        Message = "Taki dokument już istnieje w blockchain, nie możesz go wrzucić jeszcze raz."
                    };
                }

                try
                {
                    await _blockchainService.PrecheckIssueDocumentAsync(hash, normalizedOwner, documentTypeValue);
                    _logger.LogDebug("Blockchain precheck succeeded. Hash: {Hash}, Owner: {Owner}", hash, normalizedOwner);
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Blockchain precheck failed. Hash: {Hash}, Owner: {Owner}", hash, normalizedOwner);
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = string.Empty,
                        Message = BuildBlockchainErrorMessage(ex, hasPinataFile: false)
                    };
                }

                string cid;
                try
                {
                    cid = await _pinataClient.UploadAsync(tempPath, uploadFile.FileName);
                    _logger.LogDebug("Pinata upload succeeded. Hash: {Hash}, Cid: {Cid}", hash, cid);
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Pinata upload failed. Hash: {Hash}", hash);
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = string.Empty,
                        Message = $"Błąd uploadu do Pinata: {ex.Message}"
                    };
                }

                IssueTransactionResultDto issueResult;
                try
                {
                    issueResult = await _blockchainService.IssueDocumentAsync(hash, cid, normalizedOwner, documentTypeValue);
                    _logger.LogDebug(
                        "Blockchain issue transaction confirmed. Hash: {Hash}, TxHash: {TxHash}, Block: {BlockNumber}",
                        hash,
                        issueResult.TxHash,
                        issueResult.BlockNumber);
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Blockchain issue transaction failed. Hash: {Hash}, Cid: {Cid}", hash, cid);
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = cid,
                        Message = BuildBlockchainErrorMessage(ex, hasPinataFile: true)
                    };
                }

                var issuerAddress = string.IsNullOrWhiteSpace(issueResult.IssuerAddress)
                    ? _blockchainService.GetBackendAccountAddress()
                    : issueResult.IssuerAddress;

                var document = new Document
                {
                    Hash = hash,
                    Cid = cid,
                    IssuerAddress = issuerAddress.ToLowerInvariant(),
                    OwnerAddress = normalizedOwner,
                    IssuedByMemberId = issuedByMemberId,
                    DocumentType = documentTypeValue,
                    TxHash = issueResult.TxHash,
                    BlockNumber = issueResult.BlockNumber,
                    Status = StatusConfirmed,
                    IssuedAt = issueResult.BlockTimestamp,
                    ExpiresAt = null
                };

                _db.Documents.Add(document);
                try
                {
                    await _db.SaveChangesAsync();
                }
                catch (DbUpdateException ex)
                {
                    _logger.LogWarning(ex, "Failed to persist document metadata for hash {Hash}", hash);
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = cid,
                        TxHash = issueResult.TxHash,
                        Message = $"Dokument zapisany on-chain (TxHash: {issueResult.TxHash}), ale zapis metadanych w DB nie powiódł się (możliwy duplikat hash)."
                    };
                }

                return new UploadResultDto
                {
                    Hash = hash,
                    Cid = cid,
                    TxHash = issueResult.TxHash,
                    Message = $"Dokument został zapisany w Pinata, blockchain i bazie (Confirmed). TxHash: {issueResult.TxHash}"
                };
            }
            finally
            {
                if (File.Exists(tempPath))
                {
                    File.Delete(tempPath);
                    _logger.LogDebug("Temporary file deleted. TempPath: {TempPath}", tempPath);
                }
            }
        }

        public async Task<IReadOnlyList<DocumentListItemDto>> GetByOwnerAddressAsync(string ownerAddress)
        {
            var normalized = NormalizeAddress(ownerAddress);
            var rows = await _db.Documents.AsNoTracking()
                .Where(d => d.OwnerAddress == normalized)
                .OrderByDescending(d => d.IssuedAt)
                .ToListAsync();
            return rows.Select(ToListItem).ToList();
        }

        public async Task<IReadOnlyList<DocumentListItemDto>> GetByIssuerAddressAsync(string issuerAddress)
        {
            var normalized = NormalizeAddress(issuerAddress);
            var rows = await _db.Documents.AsNoTracking()
                .Where(d => d.IssuerAddress == normalized)
                .OrderByDescending(d => d.IssuedAt)
                .ToListAsync();
            return rows.Select(ToListItem).ToList();
        }

        public async Task<IReadOnlyList<DocumentListItemDto>> GetIssuedByMemberAsync(int memberId)
        {
            var rows = await _db.Documents.AsNoTracking()
                .Where(d => d.IssuedByMemberId == memberId)
                .OrderByDescending(d => d.IssuedAt)
                .ToListAsync();
            return rows.Select(ToListItem).ToList();
        }

        public async Task<DocumentListItemDto?> GetByHashAsync(string hash)
        {
            var normalized = NormalizeHash(hash);
            var row = await _db.Documents.AsNoTracking()
                .FirstOrDefaultAsync(d => d.Hash == normalized);
            return row is null ? null : ToListItem(row);
        }

        public async Task<(bool Ok, int StatusCode, string? Error)> RevokeAsync(
            string hash,
            int? memberId,
            string role)
        {
            var normalized = NormalizeHash(hash);
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return (false, 400, "hash is required");
            }

            var document = await _db.Documents.FirstOrDefaultAsync(d => d.Hash == normalized);
            if (document is null)
            {
                return (false, 404, "Document not found in database.");
            }

            var normalizedRole = (role ?? string.Empty).Trim().ToLowerInvariant();
            var isPrivileged = normalizedRole is "admin" or "owner";
            var isIssuerOwner =
                normalizedRole == "issuer" &&
                memberId is not null &&
                document.IssuedByMemberId == memberId;

            if (!isPrivileged && !isIssuerOwner)
            {
                return (false, 403, "You are not allowed to revoke this document.");
            }

            if (document.Status == StatusRevoked)
            {
                return (false, 409, "Document is already revoked.");
            }

            try
            {
                await _blockchainService.RevokeDocumentAsync(normalized);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "On-chain revoke failed for hash {Hash}", normalized);
                return (false, 502, $"Blockchain revoke failed: {ex.Message}");
            }

            document.Status = StatusRevoked;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Document {Hash} revoked by member {MemberId} role {Role}", normalized, memberId, role);
            return (true, 204, null);
        }

        private static DocumentListItemDto ToListItem(Document d) => new()
        {
            Hash = d.Hash,
            Issuer = d.IssuerAddress,
            IssuedAt = d.IssuedAt,
            Cid = d.Cid,
            DocumentType = d.DocumentType,
            TxHash = d.TxHash,
            BlockNumber = d.BlockNumber,
            Status = d.Status,
            OwnerAddress = d.OwnerAddress
        };

        private static string NormalizeAddress(string address) =>
            (address ?? string.Empty).Trim().ToLowerInvariant();

        private static string NormalizeHash(string hash) =>
            (hash ?? string.Empty).Trim().ToLowerInvariant();

        private static string BuildBlockchainErrorMessage(Exception ex, bool hasPinataFile)
        {
            var raw = GetAllExceptionMessages(ex);
            var lower = raw.ToLowerInvariant();

            string message;
            if (lower.Contains("already issued"))
            {
                message = "Taki dokument już istnieje w blockchain, nie możesz go wrzucić jeszcze raz.";
            }
            else if (lower.Contains("not authorized"))
            {
                message = "Błąd zapisu do blockchain: konto wystawcy nie ma uprawnień issuer w kontrakcie.";
            }
            else if (lower.Contains("owner required") || lower.Contains("invalid address"))
            {
                message = "Błąd zapisu do blockchain: niepoprawny adres właściciela dokumentu (owner).";
            }
            else if (lower.Contains("smart contract error") || lower.Contains("reverted without") || lower.Contains("execution reverted"))
            {
                message = "Błąd zapisu do blockchain: kontrakt odrzucił transakcję bez szczegółu. Sprawdź zgodność ABI z adresem kontraktu (stary deployment), uprawnienia issuer oraz poprawność owner/documentType.";
            }
            else
            {
                message = $"Błąd zapisu do blockchain: {raw}";
            }

            if (hasPinataFile)
            {
                return $"{message} (plik został już dodany do Pinata)";
            }

            return message;
        }

        private static string GetAllExceptionMessages(Exception ex)
        {
            var messages = new List<string>();
            Exception? current = ex;

            while (current is not null)
            {
                if (!string.IsNullOrWhiteSpace(current.Message))
                {
                    messages.Add(current.Message.Trim());
                }

                current = current.InnerException;
            }

            if (messages.Count == 0)
            {
                return "Unknown blockchain error";
            }

            return string.Join(" | ", messages.Distinct(StringComparer.Ordinal));
        }

        private static byte ParseDocumentType(string rawDocumentType)
        {
            if (string.IsNullOrWhiteSpace(rawDocumentType))
                throw new ArgumentException("documentType is required");

            var normalized = rawDocumentType
                .Trim()
                .ToLowerInvariant()
                .Replace("_", " ")
                .Replace("-", " ");

            normalized = string.Join(' ', normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries));

            return normalized switch
            {
                "education" => 0,
                "professional certificates" => 1,
                "employment documents" => 2,
                "license" => 3,
                "licence" => 3,
                "other documents" => 4,
                "other" => 4,
                _ => throw new ArgumentException("Invalid documentType. Allowed values: Education, Professional certificates, Employment documents, License, Other documents")
            };
        }
    }
}
