namespace backend.DTOs
{
    public class MemberSearchResultDto
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

        public string EthereumAddress { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }
}
