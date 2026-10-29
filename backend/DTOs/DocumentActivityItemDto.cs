namespace backend.DTOs
{
    public class DocumentActivityItemDto
    {
        public string Hash { get; set; } = string.Empty;
        public string ActivityType { get; set; } = string.Empty;
        public string? TxHash { get; set; }
        public long? BlockNumber { get; set; }
        public int? MemberId { get; set; }
        public DateTimeOffset Timestamp { get; set; }
        public string? OwnerAddress { get; set; }
        public bool FromFallback { get; set; }
        /// <summary>IPFS CID when the document file is available for preview.</summary>
        public string? Cid { get; set; }
    }
}
