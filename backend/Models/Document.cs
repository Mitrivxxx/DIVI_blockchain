using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Off-chain mirror of an issued on-chain document (hash is the shared key).
    /// </summary>
    public class Document
    {
        /// <summary>SHA-256 document hash with 0x prefix (matches chain key).</summary>
        [Key]
        [MaxLength(66)]
        public string Hash { get; set; } = string.Empty;

        [Required]
        [MaxLength(128)]
        public string Cid { get; set; } = string.Empty;

        /// <summary>On-chain issuer (msg.sender / backend hot wallet).</summary>
        [Required]
        [MaxLength(42)]
        public string IssuerAddress { get; set; } = string.Empty;

        [Required]
        [MaxLength(42)]
        public string OwnerAddress { get; set; } = string.Empty;

        /// <summary>Member who triggered upload via API (JWT), if known.</summary>
        public int? IssuedByMemberId { get; set; }

        [ForeignKey(nameof(IssuedByMemberId))]
        public Member? IssuedByMember { get; set; }

        /// <summary>0–4 matching DocumentTypes.DocumentType on-chain (Education, Experience, LicensesAndCertificates, Recommendation, HonorsAndAwards).</summary>
        public byte DocumentType { get; set; }

        [Required]
        [MaxLength(66)]
        public string TxHash { get; set; } = string.Empty;

        public long BlockNumber { get; set; }

        /// <summary>0=Pending, 1=Confirmed, 2=Revoked (contract DocumentStatus).</summary>
        public byte Status { get; set; }

        public DateTimeOffset IssuedAt { get; set; }

        /// <summary>Period start for Education/Experience metadata credentials.</summary>
        public DateTimeOffset? PeriodStart { get; set; }

        public DateTimeOffset? ExpiresAt { get; set; }

        /// <summary>Education: degree / field of study (tytuł/kierunek). Optional for other types.</summary>
        [MaxLength(256)]
        public string? Title { get; set; }

        /// <summary>0=private, 1=unlisted, 2=public.</summary>
        public byte Visibility { get; set; }

        /// <summary>Opaque share token for unlisted (and retained for public) credentials.</summary>
        [MaxLength(64)]
        public string? ShareToken { get; set; }
    }
}
