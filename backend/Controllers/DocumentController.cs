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
    /// Issues a document: PDF → IPFS + chain, or Education/Experience metadata (period dates) → chain only.
    /// </summary>
    [HttpPost("upload-document")]
    [Authorize(Roles = "issuer,admin,owner")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument(
        IFormFile? file,
        [FromForm] string documentType,
        [FromForm] string owner,
        [FromForm] string? periodFrom = null,
        [FromForm] string? periodTo = null,
        [FromForm] string? title = null)
    {
        _logger.LogInformation(
            "UploadDocument request received. FileName: {FileName}, ContentType: {ContentType}, DocumentType: {DocumentType}, Owner: {Owner}, PeriodFrom: {PeriodFrom}, PeriodTo: {PeriodTo}, Title: {Title}",
            file?.FileName,
            file?.ContentType,
            documentType,
            owner,
            periodFrom,
            periodTo,
            title);

        if (string.IsNullOrWhiteSpace(documentType))
        {
            return BadRequest("documentType is required");
        }

        if (string.IsNullOrWhiteSpace(owner))
        {
            return BadRequest("owner is required");
        }

        byte documentTypeValue;
        try
        {
            documentTypeValue = DocumentTypeCatalog.Parse(documentType);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }

        var metadataOnly = DocumentTypeCatalog.IsMetadataOnly(documentTypeValue);

        if (metadataOnly)
        {
            if (file is { Length: > 0 })
            {
                return BadRequest("Dla Wykształcenia i Doświadczenia nie przesyła się pliku.");
            }

            if (string.IsNullOrWhiteSpace(periodFrom) || string.IsNullOrWhiteSpace(periodTo))
            {
                return BadRequest("periodFrom and periodTo are required for Education/Experience");
            }

            if (string.IsNullOrWhiteSpace(title))
            {
                return BadRequest(documentTypeValue == 0
                    ? "title (tytuł/kierunek studiów) is required for Education"
                    : "title (stanowisko) is required for Experience");
            }
        }
        else
        {
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
        }

        var memberId = TryGetMemberId();
        var result = await _documentService.ProcessUploadAsync(
            file,
            documentType,
            owner,
            periodFrom,
            periodTo,
            title,
            memberId);

        _logger.LogInformation(
            "UploadDocument completed. Hash: {Hash}, Cid: {Cid}, TxHash: {TxHash}, Message: {Message}",
            result.Hash,
            result.Cid,
            result.TxHash,
            result.Message);

        return Ok(result);
    }

    /// <summary>
    /// Lists documents owned by the given Ethereum address (from DB).
    /// </summary>
    [HttpGet("owner/{ownerAddress}")]
    [Authorize]
    public async Task<IActionResult> GetByOwner(string ownerAddress)
    {
        if (string.IsNullOrWhiteSpace(ownerAddress))
        {
            return BadRequest("ownerAddress is required");
        }

        var items = await _documentService.GetByOwnerAddressAsync(ownerAddress);
        return Ok(items);
    }

    /// <summary>
    /// Lists documents issued by the given on-chain issuer address (from DB).
    /// </summary>
    [HttpGet("issuer/{issuerAddress}")]
    [Authorize]
    public async Task<IActionResult> GetByIssuer(string issuerAddress)
    {
        if (string.IsNullOrWhiteSpace(issuerAddress))
        {
            return BadRequest("issuerAddress is required");
        }

        var items = await _documentService.GetByIssuerAddressAsync(issuerAddress);
        return Ok(items);
    }

    /// <summary>
    /// Lists documents issued by the current member (JWT), regardless of hot-wallet issuer address.
    /// </summary>
    [HttpGet("issued-by-me")]
    [Authorize(Roles = "issuer,admin,owner")]
    public async Task<IActionResult> GetIssuedByMe()
    {
        var memberId = TryGetMemberId();
        if (memberId is null)
        {
            return Unauthorized();
        }

        var items = await _documentService.GetIssuedByMemberAsync(memberId.Value);
        return Ok(items);
    }

    /// <summary>
    /// Revokes a document on-chain and in DB. Issuer of the row, admin, or owner.
    /// </summary>
    [HttpDelete("{hash}/revoke")]
    [Authorize(Roles = "issuer,admin,owner")]
    public async Task<IActionResult> Revoke(string hash)
    {
        if (string.IsNullOrWhiteSpace(hash))
        {
            return BadRequest("hash is required");
        }

        var memberId = TryGetMemberId();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var (ok, statusCode, error) = await _documentService.RevokeAsync(hash, memberId, role);
        if (!ok)
        {
            return StatusCode(statusCode, new { error });
        }

        return NoContent();
    }

    /// <summary>
    /// Streams the original PDF from IPFS (Pinata gateway) for authorized viewers.
    /// </summary>
    [HttpGet("{hash}/file")]
    [Authorize]
    public async Task<IActionResult> GetFile(string hash)
    {
        if (string.IsNullOrWhiteSpace(hash))
        {
            return BadRequest("hash is required");
        }

        var memberId = TryGetMemberId();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var (bytes, statusCode, error) = await _documentService.GetFileContentAsync(hash, memberId, role);
        if (bytes is null)
        {
            return StatusCode(statusCode, new { error });
        }

        return File(bytes, "application/pdf");
    }

    [HttpPost("verify-document")]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> VerifyDocument(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("file is required");
        }

        var result = await _documentVerification.VerifyDocumentAsync(file);
        return Ok(result);
    }

    private int? TryGetMemberId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return int.TryParse(raw, out var id) ? id : null;
    }
}
