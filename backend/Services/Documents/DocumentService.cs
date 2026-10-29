using System.Security.Cryptography;
using backend.Data;
using backend.DTOs;
using backend.Infrastructure;
using backend.Models;
using backend.Services.Activity;
using backend.Services.Blockchain;
using backend.Services.Issuers;
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
        private readonly IDocumentActivityService _activityService;
        private readonly IIssuerProfileService _issuerProfileService;
        private readonly AppDbContext _db;
        private readonly ILogger<DocumentService> _logger;

        public DocumentService(
            PinataClient pinataClient,
            IBlockchainService blockchainService,
            IDocumentActivityService activityService,
            IIssuerProfileService issuerProfileService,
            AppDbContext db,
            ILogger<DocumentService> logger)
        {
            _pinataClient = pinataClient;
            _blockchainService = blockchainService;
            _activityService = activityService;
            _issuerProfileService = issuerProfileService;
            _db = db;
            _logger = logger;
        }

        public async Task<UploadResultDto> ProcessUploadAsync(
            IFormFile? file,
            string documentType,
            string owner,
            string? periodFrom,
            string? periodTo,
            string? title = null,
            int? issuedByMemberId = null)
        {
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

            if (DocumentTypeCatalog.IsMetadataOnly(documentTypeValue))
            {
                if (file is { Length: > 0 })
                {
                    return new UploadResultDto
                    {
                        Hash = string.Empty,
                        Cid = string.Empty,
                        Message = "Dla Wykształcenia i Doświadczenia nie przesyła się pliku — podaj zakres dat."
                    };
                }

                return await ProcessMetadataDocumentAsync(
                    documentTypeValue,
                    normalizedOwner,
                    periodFrom,
                    periodTo,
                    title,
                    issuedByMemberId);
            }

            if (file is null || file.Length == 0)
            {
                return new UploadResultDto
                {
                    Hash = string.Empty,
                    Cid = string.Empty,
                    Message = "Plik PDF jest wymagany dla tego typu dokumentu."
                };
            }

            return await ProcessPdfDocumentAsync(file, documentTypeValue, normalizedOwner, issuedByMemberId);
        }

        private async Task<UploadResultDto> ProcessMetadataDocumentAsync(
            byte documentTypeValue,
            string normalizedOwner,
            string? periodFrom,
            string? periodTo,
            string? title,
            int? issuedByMemberId)
        {
            if (!TryParsePeriodDates(periodFrom, periodTo, out var start, out var end, out var periodError))
            {
                return new UploadResultDto
                {
                    Hash = string.Empty,
                    Cid = string.Empty,
                    Message = periodError
                };
            }

            string? normalizedTitle = null;
            if (documentTypeValue == 0)
            {
                if (!TryNormalizeEducationTitle(title, out normalizedTitle, out var titleError))
                {
                    return new UploadResultDto
                    {
                        Hash = string.Empty,
                        Cid = string.Empty,
                        Message = titleError
                    };
                }
            }

            var typeKey = DocumentTypeCatalog.All.First(t => t.Id == documentTypeValue).ApiValue;
            var payload = documentTypeValue == 0
                ? $"{typeKey}|{normalizedOwner}|{normalizedTitle}|{start:yyyy-MM-dd}|{end:yyyy-MM-dd}"
                : $"{typeKey}|{normalizedOwner}|{start:yyyy-MM-dd}|{end:yyyy-MM-dd}";
            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(payload));
            var hash = "0x" + Convert.ToHexString(hashBytes).ToLowerInvariant();
            var cid = "meta:" + hash;

            _logger.LogDebug(
                "Metadata document hash computed. Type: {DocumentType}, Owner: {Owner}, Hash: {Hash}",
                documentTypeValue,
                normalizedOwner,
                hash);

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
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Blockchain precheck failed for metadata doc. Hash: {Hash}", hash);
                return new UploadResultDto
                {
                    Hash = hash,
                    Cid = string.Empty,
                    Message = BuildBlockchainErrorMessage(ex, hasPinataFile: false)
                };
            }

            IssueTransactionResultDto issueResult;
            try
            {
                issueResult = await _blockchainService.IssueDocumentAsync(hash, cid, normalizedOwner, documentTypeValue);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Blockchain issue failed for metadata doc. Hash: {Hash}", hash);
                return new UploadResultDto
                {
                    Hash = hash,
                    Cid = cid,
                    Message = BuildBlockchainErrorMessage(ex, hasPinataFile: false)
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
                PeriodStart = start,
                ExpiresAt = end,
                Title = normalizedTitle,
            };

            _db.Documents.Add(document);
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "Failed to persist metadata document for hash {Hash}", hash);
                return new UploadResultDto
                {
                    Hash = hash,
                    Cid = cid,
                    TxHash = issueResult.TxHash,
                    Message =
                        $"Dokument zapisany on-chain (TxHash: {issueResult.TxHash}), ale zapis metadanych w DB nie powiódł się (możliwy duplikat hash)."
                };
            }

            try
            {
                await _activityService.LogAsync(
                    hash,
                    DocumentActivityService.ActivityIssued,
                    issueResult.TxHash,
                    issueResult.BlockNumber,
                    issuedByMemberId,
                    issueResult.BlockTimestamp);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to log Issued activity for metadata hash {Hash}", hash);
            }

            return new UploadResultDto
            {
                Hash = hash,
                Cid = cid,
                TxHash = issueResult.TxHash,
                Message = "Zapisano poprawnie (okres dat, bez pliku PDF)."
            };
        }

        private async Task<UploadResultDto> ProcessPdfDocumentAsync(
            IFormFile uploadFile,
            byte documentTypeValue,
            string normalizedOwner,
            int? issuedByMemberId)
        {
            _logger.LogDebug(
                "ProcessPdfDocumentAsync started. FileName: {FileName}, ContentType: {ContentType}, SizeBytes: {SizeBytes}, DocumentType: {DocumentType}, Owner: {Owner}",
                uploadFile.FileName,
                uploadFile.ContentType,
                uploadFile.Length,
                documentTypeValue,
                normalizedOwner);

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

                try
                {
                    await _activityService.LogAsync(
                        hash,
                        DocumentActivityService.ActivityIssued,
                        issueResult.TxHash,
                        issueResult.BlockNumber,
                        issuedByMemberId,
                        issueResult.BlockTimestamp);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to log Issued activity for hash {Hash}", hash);
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
            return await MapListItemsAsync(rows);
        }

        public async Task<IReadOnlyList<DocumentListItemDto>> GetByIssuerAddressAsync(string issuerAddress)
        {
            var normalized = NormalizeAddress(issuerAddress);
            var rows = await _db.Documents.AsNoTracking()
                .Where(d => d.IssuerAddress == normalized)
                .OrderByDescending(d => d.IssuedAt)
                .ToListAsync();
            return await MapListItemsAsync(rows);
        }

        public async Task<IReadOnlyList<DocumentListItemDto>> GetIssuedByMemberAsync(int memberId)
        {
            var rows = await _db.Documents.AsNoTracking()
                .Where(d => d.IssuedByMemberId == memberId)
                .OrderByDescending(d => d.IssuedAt)
                .ToListAsync();
            return await MapListItemsAsync(rows);
        }

        public async Task<DocumentListItemDto?> GetByHashAsync(string hash)
        {
            var normalized = NormalizeHash(hash);
            var row = await _db.Documents.AsNoTracking()
                .FirstOrDefaultAsync(d => d.Hash == normalized);
            if (row is null)
            {
                return null;
            }

            var items = await MapListItemsAsync(new[] { row });
            return items.FirstOrDefault();
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

            string revokeTxHash;
            try
            {
                revokeTxHash = await _blockchainService.RevokeDocumentAsync(normalized);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "On-chain revoke failed for hash {Hash}", normalized);
                return (false, 502, $"Blockchain revoke failed: {ex.Message}");
            }

            document.Status = StatusRevoked;
            await _db.SaveChangesAsync();

            try
            {
                await _activityService.LogAsync(
                    normalized,
                    DocumentActivityService.ActivityRevoked,
                    revokeTxHash,
                    blockNumber: null,
                    memberId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to log Revoked activity for hash {Hash}", normalized);
            }

            _logger.LogInformation("Document {Hash} revoked by member {MemberId} role {Role}", normalized, memberId, role);
            return (true, 204, null);
        }

        public async Task<(byte[]? Bytes, int StatusCode, string? Error)> GetFileContentAsync(
            string hash,
            int? memberId,
            string role)
        {
            var normalized = NormalizeHash(hash);
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return (null, 400, "hash is required");
            }

            var document = await _db.Documents.AsNoTracking()
                .FirstOrDefaultAsync(d => d.Hash == normalized);
            if (document is null)
            {
                return (null, 404, "Document not found");
            }

            if (string.IsNullOrWhiteSpace(document.Cid))
            {
                return (null, 404, "Document file is not available (missing CID)");
            }

            if (document.Cid.StartsWith("meta:", StringComparison.OrdinalIgnoreCase)
                || DocumentTypeCatalog.IsMetadataOnly(document.DocumentType))
            {
                return (null, 404, "Ten dokument nie ma pliku PDF (tylko okres dat).");
            }

            var normalizedRole = (role ?? string.Empty).Trim().ToLowerInvariant();
            var isPrivileged = normalizedRole is "admin" or "owner";
            var isIssuer = memberId is not null && document.IssuedByMemberId == memberId;

            var isOwner = false;
            if (memberId is not null)
            {
                var member = await _db.Members.AsNoTracking()
                    .FirstOrDefaultAsync(m => m.Id == memberId.Value);
                if (member?.EthereumAddress is not null
                    && string.Equals(
                        member.EthereumAddress.Trim(),
                        document.OwnerAddress,
                        StringComparison.OrdinalIgnoreCase))
                {
                    isOwner = true;
                }
            }

            if (!isPrivileged && !isIssuer && !isOwner)
            {
                return (null, 403, "You are not allowed to view this document");
            }

            try
            {
                var bytes = await _pinataClient.DownloadAsync(document.Cid);
                return (bytes, 200, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to download CID {Cid} for hash {Hash}", document.Cid, normalized);
                return (null, 502, "Failed to fetch document from IPFS gateway");
            }
        }

        private async Task<IReadOnlyList<DocumentListItemDto>> MapListItemsAsync(IReadOnlyList<Document> rows)
        {
            var names = await _issuerProfileService.ResolveDisplayNamesAsync(
                rows.Where(d => d.IssuedByMemberId.HasValue).Select(d => d.IssuedByMemberId!.Value));

            return rows.Select(d => ToListItem(d, names)).ToList();
        }

        private static DocumentListItemDto ToListItem(
            Document d,
            IReadOnlyDictionary<int, string?> displayNames)
        {
            string? displayName = null;
            if (d.IssuedByMemberId is int mid)
            {
                displayNames.TryGetValue(mid, out displayName);
            }

            return new DocumentListItemDto
            {
                Hash = d.Hash,
                Issuer = d.IssuerAddress,
                IssuedAt = d.IssuedAt,
                PeriodStart = d.PeriodStart,
                ExpiresAt = d.ExpiresAt,
                Title = d.Title,
                Cid = d.Cid,
                DocumentType = d.DocumentType,
                TxHash = d.TxHash,
                BlockNumber = d.BlockNumber,
                Status = d.Status,
                OwnerAddress = d.OwnerAddress,
                IssuedByMemberId = d.IssuedByMemberId,
                IssuerDisplayName = displayName,
            };
        }

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

        private static byte ParseDocumentType(string rawDocumentType) =>
            DocumentTypeCatalog.Parse(rawDocumentType);

        private static bool TryParsePeriodDates(
            string? periodFrom,
            string? periodTo,
            out DateTimeOffset start,
            out DateTimeOffset end,
            out string error)
        {
            start = default;
            end = default;
            error = string.Empty;

            if (string.IsNullOrWhiteSpace(periodFrom) || string.IsNullOrWhiteSpace(periodTo))
            {
                error = "Dla Wykształcenia i Doświadczenia wymagane są daty od i do (periodFrom, periodTo).";
                return false;
            }

            if (!DateOnly.TryParse(periodFrom.Trim(), out var fromDate)
                || !DateOnly.TryParse(periodTo.Trim(), out var toDate))
            {
                error = "Niepoprawny format daty. Użyj RRRR-MM-DD.";
                return false;
            }

            if (fromDate > toDate)
            {
                error = "Data od nie może być późniejsza niż data do.";
                return false;
            }

            start = new DateTimeOffset(fromDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
            end = new DateTimeOffset(toDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
            return true;
        }

        private static bool TryNormalizeEducationTitle(
            string? title,
            out string normalized,
            out string error)
        {
            normalized = string.Empty;
            error = string.Empty;

            if (string.IsNullOrWhiteSpace(title))
            {
                error = "Dla Wykształcenia wymagany jest tytuł/kierunek studiów.";
                return false;
            }

            normalized = string.Join(
                ' ',
                title.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));

            if (normalized.Length > 256)
            {
                error = "Tytuł/kierunek studiów może mieć maksymalnie 256 znaków.";
                return false;
            }

            return true;
        }
    }
}
