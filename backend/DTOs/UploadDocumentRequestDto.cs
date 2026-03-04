using Microsoft.AspNetCore.Http;

namespace backend.DTOs
{
    public class UploadDocumentRequestDto
    {
        public IFormFile File { get; set; } = default!;
        public string DocumentType { get; set; } = default!;
        public string? Owner { get; set; }
    }
}
