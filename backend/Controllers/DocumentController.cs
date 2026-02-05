using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

[ApiController]
[Route("api/documents")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpPost("upload-document")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument(
        IFormFile file,
        [FromForm] string documentType,
        [FromForm] string? owner)
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

        var result = await _documentService.ProcessDocumentAsync(file);

        return Ok(result);
    }
}
