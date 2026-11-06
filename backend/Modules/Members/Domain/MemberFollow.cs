namespace backend.Modules.Members.Domain
{
    /// <summary>
    /// FollowerMemberId observes FollowingMemberId (A follows B).
    /// </summary>
    public class MemberFollow
    {
        public int FollowerMemberId { get; set; }
        public int FollowingMemberId { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
