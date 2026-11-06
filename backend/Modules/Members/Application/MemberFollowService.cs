using backend.Infrastructure.Persistence;
using backend.Modules.Members.Contracts;
using backend.Modules.Members.Domain;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Members.Application
{
    public class MemberFollowService : IMemberFollowService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<MemberFollowService> _logger;

        public MemberFollowService(AppDbContext db, ILogger<MemberFollowService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<(int StatusCode, string? Error)> FollowByAddressAsync(
            int followerMemberId,
            string ethereumAddress)
        {
            var target = await FindMemberByAddressAsync(ethereumAddress);
            if (target is null)
            {
                return (404, "Nie znaleziono użytkownika.");
            }

            if (target.Id == followerMemberId)
            {
                return (400, "Nie możesz obserwować samego siebie.");
            }

            var exists = await _db.MemberFollows.AnyAsync(f =>
                f.FollowerMemberId == followerMemberId && f.FollowingMemberId == target.Id);
            if (exists)
            {
                return (200, null);
            }

            _db.MemberFollows.Add(new MemberFollow
            {
                FollowerMemberId = followerMemberId,
                FollowingMemberId = target.Id,
                CreatedAt = DateTimeOffset.UtcNow,
            });
            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Member {FollowerId} followed member {FollowingId}",
                followerMemberId,
                target.Id);
            return (200, null);
        }

        public async Task<(int StatusCode, string? Error)> UnfollowByAddressAsync(
            int followerMemberId,
            string ethereumAddress)
        {
            var target = await FindMemberByAddressAsync(ethereumAddress);
            if (target is null)
            {
                return (404, "Nie znaleziono użytkownika.");
            }

            var row = await _db.MemberFollows.FirstOrDefaultAsync(f =>
                f.FollowerMemberId == followerMemberId && f.FollowingMemberId == target.Id);
            if (row is null)
            {
                return (200, null);
            }

            _db.MemberFollows.Remove(row);
            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Member {FollowerId} unfollowed member {FollowingId}",
                followerMemberId,
                target.Id);
            return (200, null);
        }

        public async Task<FollowStatusDto?> GetFollowStatusByAddressAsync(
            int followerMemberId,
            string ethereumAddress)
        {
            var target = await FindMemberByAddressAsync(ethereumAddress);
            if (target is null)
            {
                return null;
            }

            var isFollowing = await _db.MemberFollows.AsNoTracking().AnyAsync(f =>
                f.FollowerMemberId == followerMemberId && f.FollowingMemberId == target.Id);

            return new FollowStatusDto { IsFollowing = isFollowing };
        }

        public async Task<IReadOnlyList<FollowTargetDto>> ListFollowingByAddressAsync(
            string ethereumAddress,
            int limit = 100)
        {
            var owner = await FindMemberByAddressAsync(ethereumAddress);
            if (owner is null)
            {
                return Array.Empty<FollowTargetDto>();
            }

            var take = Math.Clamp(limit, 1, 200);
            var followingIds = await _db.MemberFollows.AsNoTracking()
                .Where(f => f.FollowerMemberId == owner.Id)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => f.FollowingMemberId)
                .Take(take)
                .ToListAsync();

            if (followingIds.Count == 0)
            {
                return Array.Empty<FollowTargetDto>();
            }

            var members = await _db.Members.AsNoTracking()
                .Where(m => followingIds.Contains(m.Id))
                .Select(m => new FollowTargetDto
                {
                    MemberId = m.Id,
                    FirstName = m.FirstName,
                    LastName = m.LastName,
                    EthereumAddress = m.EthereumAddress,
                    AvatarUrl = m.AvatarUrl,
                })
                .ToListAsync();

            var byId = members.ToDictionary(m => m.MemberId);
            return followingIds
                .Where(id => byId.ContainsKey(id))
                .Select(id => byId[id])
                .ToList();
        }

        private async Task<Member?> FindMemberByAddressAsync(string ethereumAddress)
        {
            if (string.IsNullOrWhiteSpace(ethereumAddress))
            {
                return null;
            }

            var normalized = ethereumAddress.Trim().ToLowerInvariant();
            return await _db.Members.AsNoTracking()
                .FirstOrDefaultAsync(m =>
                    m.EthereumAddress != null && m.EthereumAddress.ToLower() == normalized);
        }
    }
}
