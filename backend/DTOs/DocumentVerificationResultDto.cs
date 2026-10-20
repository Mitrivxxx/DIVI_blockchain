namespace backend.DTOs
{
    public class DocumentVerificationResultDto
    {
        public string Hash { get; set; } = default!;
        /// <summary>True when the document exists on-chain and Status is Confirmed (currently valid).</summary>
        public bool IsAuthentic { get; set; }
        public bool IsRevoked { get; set; }
        /// <summary>0=Pending, 1=Confirmed, 2=Revoked. Null if document was never issued.</summary>
        public byte? Status { get; set; }
        public string Message { get; set; } = default!;
        public string? TransactionHash { get; set; }
        public long? BlockNumber { get; set; }
        public DateTimeOffset? BlockTimestamp { get; set; }
        public string? NetworkName { get; set; }
    }
}
