using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class RegisterUserDto
    {
        [Required]
        [MaxLength(32)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Password { get; set; } = string.Empty;
    }
}