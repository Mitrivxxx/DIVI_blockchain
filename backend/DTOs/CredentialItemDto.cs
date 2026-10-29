namespace backend.DTOs
{
    public class CredentialItemDto
    {
        public string Hash { get; set; } = string.Empty;
        public byte DocumentType { get; set; }
        public byte Status { get; set; }
        public DateTimeOffset IssuedAt { get; set; }
        public DateTimeOffset? PeriodStart { get; set; }
        public DateTimeOffset? ExpiresAt { get; set; }
        /// <summary>Education: degree / field of study.</summary>
        public string? Title { get; set; }
        public string IssuerAddress { get; set; } = string.Empty;
        public string OwnerAddress { get; set; } = string.Empty;
        public string TxHash { get; set; } = string.Empty;
        public long BlockNumber { get; set; }
        public string Visibility { get; set; } = "private";
        public string? ShareToken { get; set; }
        public string Cid { get; set; } = string.Empty;
        public int? IssuedByMemberId { get; set; }
        public string? IssuerDisplayName { get; set; }
        public string? IssuerLogoUrl { get; set; }
    }
}
