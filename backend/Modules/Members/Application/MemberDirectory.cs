using System.Linq.Expressions;
using backend.BuildingBlocks;
using backend.Infrastructure.Persistence;
using backend.Modules.Members.Contracts;
using backend.Modules.Members.Domain;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Members.Application;

public sealed class MemberDirectory : IMemberDirectory
{
    private static readonly Expression<Func<Member, MemberAccount>> ToAccount = m => new MemberAccount(
        m.Id,
        m.Email,
        m.EthereumAddress,
        m.FirstName,
        m.LastName,
        m.AvatarUrl,
        m.MemberRoleId,
        m.Role.Name,
        m.CreatedAt);

    private readonly AppDbContext _db;

    public MemberDirectory(AppDbContext db)
    {
        _db = db;
    }

    public Task<MemberAccount?> FindByIdAsync(int memberId) =>
        _db.Members.AsNoTracking()
            .Where(m => m.Id == memberId)
            .Select(ToAccount)
            .FirstOrDefaultAsync();

    public Task<MemberAccount?> FindByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return _db.Members.AsNoTracking()
            .Where(m => m.Email != null && m.Email.ToLower() == normalized)
            .Select(ToAccount)
            .FirstOrDefaultAsync();
    }

    public async Task<(MemberAccount Account, string? PasswordHash)?> FindWithPasswordHashByEmailAsync(string email)
    {
        var account = await FindByEmailAsync(email);
        if (account is null)
        {
            return null;
        }

        var hash = await _db.Members.AsNoTracking()
            .Where(m => m.Id == account.Id)
            .Select(m => m.Password)
            .FirstOrDefaultAsync();

        return (account, hash);
    }

    public Task<MemberAccount?> FindByEthereumAddressAsync(string ethereumAddress)
    {
        var normalized = ethereumAddress.Trim().ToLowerInvariant();
        return _db.Members.AsNoTracking()
            .Where(m => m.EthereumAddress != null && m.EthereumAddress.ToLower() == normalized)
            .Select(ToAccount)
            .FirstOrDefaultAsync();
    }

    public Task<MemberAccount?> FindByGoogleSubAsync(string googleSub) =>
        _db.Members.AsNoTracking()
            .Where(m => m.GoogleSub == googleSub)
            .Select(ToAccount)
            .FirstOrDefaultAsync();

    public async Task<IReadOnlyDictionary<int, MemberAccount>> GetByIdsAsync(IEnumerable<int> memberIds)
    {
        var ids = memberIds.Where(id => id > 0).Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<int, MemberAccount>();
        }

        var accounts = await _db.Members.AsNoTracking()
            .Where(m => ids.Contains(m.Id))
            .Select(ToAccount)
            .ToListAsync();

        return accounts.ToDictionary(a => a.Id);
    }

    public async Task<MemberAccount> CreateAsync(NewMemberAccount account)
    {
        var member = new Member
        {
            Email = account.Email,
            Password = account.PasswordHash,
            EthereumAddress = account.EthereumAddress,
            GoogleSub = account.GoogleSub,
            FirstName = account.FirstName,
            LastName = account.LastName,
            MemberRoleId = MemberRoles.UserId,
            CreatedAt = DateTime.UtcNow,
            Role = null!
        };

        _db.Members.Add(member);
        await _db.SaveChangesAsync();

        return await FindByIdAsync(member.Id)
            ?? throw new InvalidOperationException($"Member {member.Id} not found after insert.");
    }

    public async Task<bool> SetRoleAsync(int memberId, int memberRoleId)
    {
        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == memberId);
        if (member is null)
        {
            return false;
        }

        member.MemberRoleId = memberRoleId;
        await _db.SaveChangesAsync();
        return true;
    }
}
