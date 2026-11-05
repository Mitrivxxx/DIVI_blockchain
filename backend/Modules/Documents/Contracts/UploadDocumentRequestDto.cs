namespace backend.Modules.Documents.Contracts
{
    public class UploadDocumentRequestDto
    {
        public IFormFile File { get; set; } = default!;
        public string DocumentType { get; set; } = default!;
        public string? Owner { get; set; }
    }
}
