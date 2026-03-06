using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class UpdateProfileNameDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateProfileEmailDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class UpdateProfileBioDto
    {
        [Required]
        public string Bio { get; set; } = string.Empty;
    }
}
