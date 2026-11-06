namespace backend.Modules.Members.Contracts
{
    public class FollowTargetDto
    {
        public int MemberId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Name
        {
            get
            {
                var combined = $"{FirstName} {LastName}".Trim();
                return string.IsNullOrWhiteSpace(combined) ? null : combined;
            }
        }
        public string? EthereumAddress { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class FollowStatusDto
    {
        public bool IsFollowing { get; set; }
    }
}
