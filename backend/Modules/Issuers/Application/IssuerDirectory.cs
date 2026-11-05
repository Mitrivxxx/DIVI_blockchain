using backend.Infrastructure.Persistence;
using backend.Modules.Issuers.Contracts;
using backend.Modules.Members.Contracts;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Issuers.Application;

public sealed class IssuerDirectory : IIssuerDirectory
{
    private readonly AppDbContext _db;
    private readonly IMemberDirectory _members;

    public IssuerDirectory(AppDbContext db, IMemberDirectory members)
    {
        _db = db;
        _members = members;
    }

    public async Task<IReadOnlyDictionary<int, string?>> ResolveDisplayNamesAsync(IEnumerable<int> memberIds)
    {
        var ids = memberIds.Where(id => id > 0).Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<int, string?>();
        }

        var profiles = await _db.IssuerProfiles.AsNoTracking()
            .Where(p => ids.Contains(p.MemberId))
            .Select(p => new { p.MemberId, p.InstitutionName })
            .ToListAsync();

        var result = profiles.ToDictionary(
            p => p.MemberId,
            p => string.IsNullOrWhiteSpace(p.InstitutionName) ? null : p.InstitutionName.Trim());

        var missing = ids.Where(id => !result.ContainsKey(id) || result[id] is null).ToList();
        if (missing.Count > 0)
        {
            var members = await _members.GetByIdsAsync(missing);
            foreach (var m in members.Values)
            {
                var display = FormatPersonName(m.FirstName, m.LastName);
                if (!string.IsNullOrWhiteSpace(display))
                {
                    result[m.Id] = display;
                }
                else if (!result.ContainsKey(m.Id))
                {
                    result[m.Id] = null;
                }
            }
        }

        return result;
    }

    public async Task<string?> ResolveDisplayNameAsync(int? memberId)
    {
        if (memberId is not int id || id <= 0)
        {
            return null;
        }

        var map = await ResolveDisplayNamesAsync(new[] { id });
        return map.TryGetValue(id, out var name) ? name : null;
    }

    public async Task<IReadOnlyDictionary<int, string?>> ResolveLogoUrlsAsync(IEnumerable<int> memberIds)
    {
        var ids = memberIds.Where(id => id > 0).Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<int, string?>();
        }

        var logos = await _db.IssuerProfiles.AsNoTracking()
            .Where(p => ids.Contains(p.MemberId))
            .Select(p => new { p.MemberId, p.LogoUrl })
            .ToListAsync();

        var logoByMember = logos.ToDictionary(
            r => r.MemberId,
            r => string.IsNullOrWhiteSpace(r.LogoUrl) ? null : r.LogoUrl.Trim());

        var missingIds = ids.Where(id => !logoByMember.TryGetValue(id, out var url) || string.IsNullOrWhiteSpace(url))
            .ToList();

        if (missingIds.Count > 0)
        {
            var members = await _members.GetByIdsAsync(missingIds);
            foreach (var m in members.Values)
            {
                if (!string.IsNullOrWhiteSpace(m.AvatarUrl))
                {
                    logoByMember[m.Id] = m.AvatarUrl.Trim();
                }
            }
        }

        foreach (var id in ids)
        {
            logoByMember.TryAdd(id, null);
        }

        return logoByMember;
    }

    public async Task<string?> ResolveLogoUrlAsync(int? memberId)
    {
        if (memberId is not int id || id <= 0)
        {
            return null;
        }

        var map = await ResolveLogoUrlsAsync(new[] { id });
        return map.TryGetValue(id, out var url) ? url : null;
    }

    private static string? FormatPersonName(string? first, string? last)
    {
        var parts = new[] { first?.Trim(), last?.Trim() }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        var name = string.Join(' ', parts);
        return string.IsNullOrWhiteSpace(name) ? null : name;
    }
}
