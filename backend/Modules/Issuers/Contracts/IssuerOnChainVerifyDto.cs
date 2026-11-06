namespace backend.Modules.Issuers.Contracts
{
    /// <summary>Ephemeral result of checking authorizedIssuers on-chain. Not persisted.</summary>
    public class IssuerOnChainVerifyDto
    {
        public string EthereumAddress { get; set; } = string.Empty;
        public bool IsIssuer { get; set; }
        public string NetworkName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
