namespace backend.DTOs
{
    public class DocumentVerificationResultDto
    {
        public string Hash { get; set; } = default!;
        public bool IsAuthentic { get; set; }
        public string Message { get; set; } = default!;
        public string? TransactionHash { get; set; }
        public long? BlockNumber { get; set; }
        public DateTimeOffset? BlockTimestamp { get; set; }
        public string? NetworkName { get; set; }
    }
}