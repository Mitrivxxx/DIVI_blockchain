namespace backend.Models
{
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    public class Admin
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(42, MinimumLength = 42, ErrorMessage = "Ethereum address must be 42 characters long.")]
        public string EthereumAddress { get; set; } = string.Empty;
    }
}