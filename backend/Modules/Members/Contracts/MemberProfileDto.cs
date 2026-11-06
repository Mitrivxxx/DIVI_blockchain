namespace backend.Modules.Members.Contracts
{
    public class MemberProfileDto
    {
        public int MemberId { get; set; }
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
        public string? LinkedInUrl { get; set; }
        public string? GithubUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
