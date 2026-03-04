using Microsoft.AspNetCore.Mvc;
using backend.Services.Documents;
using backend.Services.DocumentVerification;

[ApiController]
[Route("api/documents")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IDocumentVerification _documentVerification;

    public DocumentController(IDocumentService documentService, IDocumentVerification documentVerification)
    {
        _documentService = documentService;
        _documentVerification = documentVerification;
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
        if (file == null)
            return BadRequest("file is required");

        if (file.Length == 0)
            return BadRequest("file is empty");

        if (string.IsNullOrWhiteSpace(documentType))
            return BadRequest("documentType is required");

        if (string.IsNullOrWhiteSpace(owner))
            return BadRequest("owner is required");

        const long maxFileSizeBytes = 5 * 1024 * 1024;
        if (file.Length > maxFileSizeBytes)
            return BadRequest("file is too large");

        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest("only pdf files are allowed");

        var result = await _documentService.ProcessDocumentAsync(file, documentType, owner);

        return Ok(result);
    }

    /// <summary>
    /// Verifies document authenticity by checking whether its SHA-256 hash exists on blockchain.
    /// </summary>
    [HttpPost("verify-document")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> VerifyDocument(IFormFile file)
    {
        if (file == null)
            return BadRequest("file is required");

        if (file.Length == 0)
            return BadRequest("file is empty");

        const long maxFileSizeBytes = 5 * 1024 * 1024;
        if (file.Length > maxFileSizeBytes)
            return BadRequest("file is too large");

        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest("only pdf files are allowed");

        var result = await _documentVerification.VerifyDocumentAsync(file);
        return Ok(result);
    }
}
