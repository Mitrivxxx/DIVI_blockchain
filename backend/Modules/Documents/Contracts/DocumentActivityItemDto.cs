namespace backend.Modules.Documents.Contracts
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
        /// <summary>IPFS CID when the document file is available for preview (owner activity only).</summary>
        public string? Cid { get; set; }
        /// <summary>True when PDF can be opened via GET /api/documents/{hash}/file.</summary>
        public bool HasPdfFile { get; set; }
    }
}
