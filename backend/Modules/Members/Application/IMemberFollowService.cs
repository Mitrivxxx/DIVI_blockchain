using backend.Modules.Members.Contracts;

namespace backend.Modules.Members.Application
{
    public interface IMemberFollowService
    {
        Task<(int StatusCode, string? Error)> FollowByAddressAsync(int followerMemberId, string ethereumAddress);
        Task<(int StatusCode, string? Error)> UnfollowByAddressAsync(int followerMemberId, string ethereumAddress);
        Task<FollowStatusDto?> GetFollowStatusByAddressAsync(int followerMemberId, string ethereumAddress);
        Task<IReadOnlyList<FollowTargetDto>> ListFollowingByAddressAsync(string ethereumAddress, int limit = 100);
    }
}
