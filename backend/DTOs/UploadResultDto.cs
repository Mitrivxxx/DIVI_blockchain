namespace backend.DTOs
{
    public class UploadResultDto
    {
        public string Hash { get; set; } = default!;
        public string Cid { get; set; } = default!;
        public string? TxHash { get; set; }
        public string Message { get; set; } = default!;
    }
}