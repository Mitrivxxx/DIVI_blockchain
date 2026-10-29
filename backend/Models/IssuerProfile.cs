using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Off-chain institution identity for an issuer Member (1:1).
    /// On-chain issuer address is often the backend hot wallet; this is the public name.
    /// </summary>
    public class IssuerProfile
    {
        [Key]
        public int MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public Member Member { get; set; } = null!;

        [Required]
        [MaxLength(255)]
        public string InstitutionName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(512)]
        public string? LogoUrl { get; set; }

        [MaxLength(512)]
        public string? WebsiteUrl { get; set; }

        [MaxLength(64)]
        public string? Country { get; set; }

        /// <summary>NIP / KRS or similar tax/registry id (free text).</summary>
        [MaxLength(32)]
        public string? TaxId { get; set; }

        public DateTimeOffset UpdatedAt { get; set; }
    }
}
