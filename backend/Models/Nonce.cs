
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Nonce
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(42, MinimumLength = 42, ErrorMessage = "Ethereum address must be 42 characters long.")]
        public string Address { get; set; } = string.Empty;

        [Required]
        [StringLength(100, ErrorMessage = "Value cannot be longer than 100 characters.")]
        public string Value { get; set; } = string.Empty;

        [Required]
        public bool IsUsed { get; set; } = true;

        [Required]
        public DateTime ExpiresAt { get; set; }
    }
}