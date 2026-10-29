namespace backend.DTOs
{
    public class IssuerProfileDto
    {
        public int MemberId { get; set; }
        public string InstitutionName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? Country { get; set; }
        public string? TaxId { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class UpdateIssuerProfileDto
    {
        public string? InstitutionName { get; set; }
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? Country { get; set; }
        public string? TaxId { get; set; }
    }
}
