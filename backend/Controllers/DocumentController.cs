using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Documents;
using backend.Services.DocumentVerification;

[ApiController]
[Route("api/documents")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IDocumentVerification _documentVerification;
    private readonly ILogger<DocumentController> _logger;

    public DocumentController(
        IDocumentService documentService,
        IDocumentVerification documentVerification,
        ILogger<DocumentController> logger)
    {
        _documentService = documentService;
        _documentVerification = documentVerification;
        _logger = logger;
    }

    /// <summary>
    /// Uploads a document, stores it in IPFS, issues it on the blockchain, and saves metadata in the database.
    /// </summary>
    [HttpPost("upload-document")]
    [Authorize(Roles = "issuer,admin,owner")]
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

        var memberId = TryGetMemberId();
        var result = await _documentService.ProcessDocumentAsync(file, documentType, owner, memberId);

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

        var certificates = await _documentService.GetByOwnerAddressAsync(ownerAddress);
        return Ok(certificates);
    }

    [HttpGet("issuer/{issuerAddress}")]
    public async Task<IActionResult> GetIssuerDocuments(string issuerAddress)
    {
        if (string.IsNullOrWhiteSpace(issuerAddress))
        {
            return BadRequest("issuerAddress is required");
        }

        var documents = await _documentService.GetByIssuerAddressAsync(issuerAddress);
        return Ok(documents);
    }

    [HttpGet("issued-by-me")]
    [Authorize(Roles = "issuer,admin,owner")]
    public async Task<IActionResult> GetIssuedByMe()
    {
        var memberId = TryGetMemberId();
        if (memberId is null)
        {
            return Unauthorized("Member id missing from token.");
        }

        var documents = await _documentService.GetIssuedByMemberAsync(memberId.Value);
        return Ok(documents);
    }

    /// <summary>
    /// Revokes an issued document on-chain and marks Status=Revoked in the database.
    /// </summary>
    [HttpDelete("{hash}/revoke")]
    [Authorize(Roles = "issuer,admin,owner")]
    public async Task<IActionResult> RevokeDocument(string hash)
    {
        var memberId = TryGetMemberId();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";

        var (ok, statusCode, error) = await _documentService.RevokeAsync(hash, memberId, role);
        if (ok)
        {
            return NoContent();
        }

        return statusCode switch
        {
            400 => BadRequest(error),
            403 => StatusCode(StatusCodes.Status403Forbidden, error),
            404 => NotFound(error),
            409 => Conflict(error),
            _ => StatusCode(statusCode, error)
        };
    }

    private int? TryGetMemberId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(sub, out var id))
        {
            return id;
        }

        return null;
    }
}
