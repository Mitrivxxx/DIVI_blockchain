using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public enum MemberRole
{
    Admin,
    Issuer,
    User
}

namespace backend.Models
{
    public class Member
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string? Name { get; set; }

        [Required]
        [MaxLength(42)]
        public required string EthereumAddress { get; set; }

        [Required]
        public MemberRole Role { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        public string? Bio { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? AvatarUrl { get; set; }
    }
}