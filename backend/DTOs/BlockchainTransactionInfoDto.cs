namespace backend.DTOs
{
    public class BlockchainTransactionInfoDto
    {
        public string TransactionHash { get; set; } = default!;
        public long BlockNumber { get; set; }
        public DateTimeOffset BlockTimestamp { get; set; }
        public string NetworkName { get; set; } = default!;
    }
}