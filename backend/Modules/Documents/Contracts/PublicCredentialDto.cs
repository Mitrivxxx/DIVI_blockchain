namespace backend.Modules.Documents.Contracts
{
    public class PublicCredentialDto
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
        public int? IssuedByMemberId { get; set; }
        public string? IssuerDisplayName { get; set; }
        /// <summary>Issuer institution logo, or issuing member avatar as fallback.</summary>
        public string? IssuerLogoUrl { get; set; }
        /// <summary>True when a real IPFS PDF can be opened via GET /api/documents/{hash}/file (no CID leaked).</summary>
        public bool HasPdfFile { get; set; }
    }
}
