namespace backend.Modules.Issuers.Contracts
{
    /// <summary>Public catalog row for an institution (IssuerProfile).</summary>
    public class InstitutionListItemDto
    {
        public int MemberId { get; set; }
        public string InstitutionName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? Country { get; set; }
        public string? TaxId { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        /// <summary>Member ETH when present — for linking to /u/:address.</summary>
        public string? EthereumAddress { get; set; }
    }
}
