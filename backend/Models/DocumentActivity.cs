using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Off-chain audit event for document lifecycle (issue / revoke).
    /// </summary>
    public class DocumentActivity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(66)]
        public string DocumentHash { get; set; } = string.Empty;

        /// <summary>0=Issued, 1=Revoked.</summary>
        public byte ActivityType { get; set; }

        [MaxLength(66)]
        public string? TxHash { get; set; }

        public long? BlockNumber { get; set; }

        /// <summary>Member who performed the action (issuer/admin/owner), if known.</summary>
        public int? MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public Member? Member { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
    }
}
