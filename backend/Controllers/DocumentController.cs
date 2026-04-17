using Microsoft.AspNetCore.Mvc;
using backend.Services.Documents;
using backend.Services.DocumentVerification;
using backend.Services.Blockchain;

[ApiController]
[Route("api/documents")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IDocumentVerification _documentVerification;
    private readonly IBlockchainService _blockchainService;
    private readonly ILogger<DocumentController> _logger;

    public DocumentController(
        IDocumentService documentService,
        IDocumentVerification documentVerification,
        IBlockchainService blockchainService,
        ILogger<DocumentController> logger)
    {
        _documentService = documentService;
        _documentVerification = documentVerification;
        _blockchainService = blockchainService;
        _logger = logger;
    }

    /// <summary>
    /// Uploads a document, stores it in IPFS, issues it on the blockchain, and saves metadata in the database.
    /// </summary>

    [HttpPost("upload-document")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument(
        IFormFile file,
        [FromForm] string documentType,
        [FromForm] string owner)
    {
        _logger.LogInformation(
            "UploadDocument request received. FileName: {FileName}, ContentType: {ContentType}, DocumentType: {DocumentType}, Owner: {Owner}",
            file?.FileName,
            file?.ContentType,
            documentType,
            owner);

        if (file == null)
        {
            return BadRequest("file is required");
        }

        if (file.Length == 0)
        {
            return BadRequest("file is empty");
        }

        if (string.IsNullOrWhiteSpace(documentType))
        {
            return BadRequest("documentType is required");
        }

        if (string.IsNullOrWhiteSpace(owner))
        {
            return BadRequest("owner is required");
        }

        const long maxFileSizeBytes = 5 * 1024 * 1024;
        if (file.Length > maxFileSizeBytes)
        {
            return BadRequest("file is too large");
        }

        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("only pdf files are allowed");
        }

        var result = await _documentService.ProcessDocumentAsync(file, documentType, owner);

        _logger.LogInformation(
            "UploadDocument completed. Hash: {Hash}, Cid: {Cid}, TxHash: {TxHash}, Message: {Message}",
            result.Hash,
            result.Cid,
            result.TxHash,
            result.Message);

        return Ok(result);
    }

    /// <summary>
    /// Verifies document authenticity by checking whether its SHA-256 hash exists on blockchain.
    /// </summary>
    [HttpPost("verify-document")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> VerifyDocument(IFormFile file)
    {
        _logger.LogInformation(
            "VerifyDocument request received. FileName: {FileName}, ContentType: {ContentType}",
            file?.FileName,
            file?.ContentType);

        if (file == null)
        {
            return BadRequest("file is required");
        }

        if (file.Length == 0)
        {
            return BadRequest("file is empty");
        }

        const long maxFileSizeBytes = 5 * 1024 * 1024;
        if (file.Length > maxFileSizeBytes)
        {
            return BadRequest("file is too large");
        }

        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("only pdf files are allowed");
        }

        var result = await _documentVerification.VerifyDocumentAsync(file);
        _logger.LogInformation("VerifyDocument completed. Hash: {Hash}, IsAuthentic: {IsAuthentic}", result.Hash, result.IsAuthentic);

        return Ok(result);
    }

    [HttpGet("owner/{ownerAddress}")]
    public async Task<IActionResult> GetOwnerCertificates(string ownerAddress)
    {
        _logger.LogInformation("GetOwnerCertificates request received. Owner: {Owner}", ownerAddress);

        if (string.IsNullOrWhiteSpace(ownerAddress))
        {
            return BadRequest("ownerAddress is required");
        }

        var certificates = await _blockchainService.GetDocumentsByOwnerAsync(ownerAddress);
        return Ok(certificates);
    }
}
