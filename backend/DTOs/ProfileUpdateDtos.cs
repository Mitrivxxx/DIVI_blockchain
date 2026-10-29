using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// Accepts either a single <see cref="Name"/> or FirstName (+ optional LastName).
    /// </summary>
    public class UpdateProfileNameDto
    {
        public string? Name { get; set; }

        public string? FirstName { get; set; }

        public string? LastName { get; set; }
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
