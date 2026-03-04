namespace backend.DTOs
{
    public class DocumentVerificationResultDto
    {
        public string Hash { get; set; } = default!;
        public bool IsAuthentic { get; set; }
        public string Message { get; set; } = default!;
    }
}