namespace backend.DTOs
{
    public class MemberProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        /// <summary>Display name: FirstName + LastName trimmed.</summary>
        public string? Name
        {
            get
            {
                var combined = $"{FirstName} {LastName}".Trim();
                return string.IsNullOrWhiteSpace(combined) ? null : combined;
            }
        }

        public string? EthereumAddress { get; set; }
        public string Role { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Bio { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
