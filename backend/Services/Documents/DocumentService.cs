using System.Security.Cryptography;
using backend.DTOs;
using backend.Infrastructure;
using backend.Services.Blockchain;
using Microsoft.Extensions.Logging;
using Nethereum.Util;

namespace backend.Services.Documents
{
	public class DocumentService : IDocumentService
	  {
        private readonly PinataClient _pinataClient;
        private readonly IBlockchainService _blockchainService;
        private readonly ILogger<DocumentService> _logger;

        public DocumentService(
            PinataClient pinataClient,
            IBlockchainService blockchainService,
            ILogger<DocumentService> logger)
        {
            _pinataClient = pinataClient;
            _blockchainService = blockchainService;
            _logger = logger;
        }

        public async Task<UploadResultDto> ProcessDocumentAsync(IFormFile file, string documentType, string owner)
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

            var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            _logger.LogDebug("Temporary file created for upload pipeline. TempPath: {TempPath}", tempPath);

            await using (var fs = new FileStream(tempPath, FileMode.Create))
            {
                await uploadFile.CopyToAsync(fs);
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

                _logger.LogDebug("Computed SHA-256 hash for uploaded file. Hash: {Hash}", hash);

                // 2. Sprawdź czy dokument już istnieje w blockchain
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

                // 3. Pre-check kontraktu przed uploadem do Pinata
                try
                {
                    await _blockchainService.PrecheckIssueDocumentAsync(hash, owner, documentTypeValue);
                    _logger.LogDebug("Blockchain precheck succeeded. Hash: {Hash}, Owner: {Owner}", hash, owner);
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Blockchain precheck failed. Hash: {Hash}, Owner: {Owner}", hash, owner);
                    return new UploadResultDto
                    {
                        Hash = hash,
                        Cid = string.Empty,
                        Message = BuildBlockchainErrorMessage(ex, hasPinataFile: false)
                    };
                }

                // 4. Upload do Pinata → CID
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

                // 5. Zapis do blockchaina
                string txHash;
                try
                {
                    txHash = await _blockchainService.IssueDocumentAsync(hash, cid, owner, documentTypeValue);
                    _logger.LogDebug("Blockchain issue transaction confirmed. Hash: {Hash}, TxHash: {TxHash}", hash, txHash);
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

                return new UploadResultDto
                {
                    Hash = hash,
                    Cid = cid,
                    TxHash = txHash,
                    Message = $"Dokument został zapisany w Pinata i blockchain (Confirmed). TxHash: {txHash}"
                };
            }
            finally
            {
                // 6. CLEANUP
                if (File.Exists(tempPath))
                {
                    File.Delete(tempPath);
                    _logger.LogDebug("Temporary file deleted. TempPath: {TempPath}", tempPath);
                }
            }
        }

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

        // Contract enum mapping:
        // 0 = Education, 1 = ProfessionalCertificates, 2 = EmploymentDocuments, 3 = License, 4 = OtherDocuments
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