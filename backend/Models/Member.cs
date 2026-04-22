using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Member
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string? Name { get; set; }

        [MaxLength(255)]
        public string? Password { get; set; }

        [MaxLength(42)]
        public string? EthereumAddress { get; set; }

        [Required]
        public int MemberRoleId { get; set; }

        [Required]
        public MemberRole Role { get; set; } = null!;

        [EmailAddress]
        public string? Email { get; set; }

        public string? Bio { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? AvatarUrl { get; set; }
    }
}