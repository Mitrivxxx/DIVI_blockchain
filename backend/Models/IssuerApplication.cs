
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public enum IssuerApplicationStatus
{
    Pending,
    Approved,
    Rejected
}

namespace backend.Models
{
    public class IssuerApplication
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "Institution name cannot be longer than 100 characters.")]
        public string InstitutionName { get; set; } = string.Empty;

        [Required]
        [StringLength(42, MinimumLength = 42, ErrorMessage = "Ethereum address must be 42 characters long.")]
        public string EthereumAddress { get; set; } = string.Empty;

        [Required]
        [EmailAddress(ErrorMessage = "Invalid email address.")]
        [StringLength(100, ErrorMessage = "Email cannot be longer than 100 characters.")]
        public string Email { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot be longer than 500 characters.")]
        public string Description { get; set; } = string.Empty;

        [Required]
        public IssuerApplicationStatus Status { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }
    }

}