namespace backend.DTOs
{
    public class DocumentListItemDto
    {
        public string Hash { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public DateTimeOffset IssuedAt { get; set; }
        public string Cid { get; set; } = string.Empty;
        public byte DocumentType { get; set; }
        public string? TxHash { get; set; }
        public long BlockNumber { get; set; }
        public byte Status { get; set; }
        public string? OwnerAddress { get; set; }
    }
}
