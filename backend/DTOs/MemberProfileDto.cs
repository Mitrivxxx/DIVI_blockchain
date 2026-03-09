namespace backend.DTOs
{
    public class MemberProfileDto
    {
        public string? Name { get; set; }
        public string EthereumAddress { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Bio { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
