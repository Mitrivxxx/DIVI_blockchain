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
        if (file == null || file.Length == 0)
            return BadRequest("File is required");

        var result = await _documentService.ProcessDocumentAsync(file);

        return Ok(result);
    }
}
