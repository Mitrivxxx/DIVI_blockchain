namespace backend.DTOs
{
    public class DocumentListItemDto
    {
        public string Hash { get; set; } = string.Empty;
        /// <summary>On-chain issuer address (often backend hot wallet).</summary>
        public string Issuer { get; set; } = string.Empty;
        public DateTimeOffset IssuedAt { get; set; }
        public DateTimeOffset? PeriodStart { get; set; }
        public DateTimeOffset? ExpiresAt { get; set; }
        /// <summary>Education: degree / field of study.</summary>
        public string? Title { get; set; }
        public string Cid { get; set; } = string.Empty;
        public byte DocumentType { get; set; }
        public string? TxHash { get; set; }
        public long BlockNumber { get; set; }
        public byte Status { get; set; }
        public string? OwnerAddress { get; set; }
        public int? IssuedByMemberId { get; set; }
        /// <summary>Institution name from IssuerProfile (or member name), when known.</summary>
        public string? IssuerDisplayName { get; set; }
    }
}
