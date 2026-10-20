namespace backend.DTOs
{
    public class IssueTransactionResultDto
    {
        public string TxHash { get; set; } = string.Empty;
        public long BlockNumber { get; set; }
        public DateTimeOffset BlockTimestamp { get; set; }
        public string IssuerAddress { get; set; } = string.Empty;
    }
}
