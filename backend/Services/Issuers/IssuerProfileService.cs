using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Issuers
{
    public class IssuerProfileService : IIssuerProfileService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<IssuerProfileService> _logger;

        public IssuerProfileService(AppDbContext db, ILogger<IssuerProfileService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task UpsertFromApplicationAsync(int memberId, string institutionName, string? description)
        {
            var name = (institutionName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                name = "Institution";
            }

            var profile = await _db.IssuerProfiles.FirstOrDefaultAsync(p => p.MemberId == memberId);
            if (profile is null)
            {
                _db.IssuerProfiles.Add(new IssuerProfile
                {
                    MemberId = memberId,
                    InstitutionName = name,
                    Description = Truncate(description, 500),
                    UpdatedAt = DateTimeOffset.UtcNow,
                });
            }
            else
            {
                profile.InstitutionName = name;
                profile.Description = Truncate(description, 500);
                profile.UpdatedAt = DateTimeOffset.UtcNow;
                // Keep LogoUrl / WebsiteUrl / Country / TaxId
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("IssuerProfile upserted for member {MemberId}", memberId);
        }

        public async Task<IssuerProfileDto?> GetMyProfileAsync(int memberId)
        {
            var profile = await _db.IssuerProfiles.AsNoTracking()
                .FirstOrDefaultAsync(p => p.MemberId == memberId);

            if (profile is null)
            {
                profile = await TryLazySeedFromApprovedApplicationAsync(memberId);
            }

            return profile is null ? null : ToDto(profile);
        }

        public async Task<(IssuerProfileDto? Profile, int StatusCode, string? Error)> UpdateMyProfileAsync(
            int memberId,
            UpdateIssuerProfileDto dto)
        {
            if (dto is null)
            {
                return (null, 400, "Body is required");
            }

            var profile = await _db.IssuerProfiles.FirstOrDefaultAsync(p => p.MemberId == memberId);
            if (profile is null)
            {
                profile = await TryLazySeedFromApprovedApplicationAsync(memberId, track: true);
            }

            if (profile is null)
            {
                var name = dto.InstitutionName?.Trim();
                if (string.IsNullOrWhiteSpace(name))
                {
                    return (null, 400, "InstitutionName is required when creating a profile");
                }

                profile = new IssuerProfile
                {
                    MemberId = memberId,
                    InstitutionName = Truncate(name, 255)!,
                    Description = Truncate(dto.Description, 500),
                    LogoUrl = Truncate(dto.LogoUrl, 512),
                    WebsiteUrl = Truncate(dto.WebsiteUrl, 512),
                    Country = Truncate(dto.Country, 64),
                    TaxId = Truncate(dto.TaxId, 32),
                    UpdatedAt = DateTimeOffset.UtcNow,
                };
                _db.IssuerProfiles.Add(profile);
            }
            else
            {
                if (dto.InstitutionName is not null)
                {
                    var name = dto.InstitutionName.Trim();
                    if (string.IsNullOrWhiteSpace(name))
                    {
                        return (null, 400, "InstitutionName cannot be empty");
                    }
                    profile.InstitutionName = Truncate(name, 255)!;
                }

                if (dto.Description is not null)
                {
                    profile.Description = Truncate(dto.Description, 500);
                }

                if (dto.LogoUrl is not null)
                {
                    profile.LogoUrl = Truncate(dto.LogoUrl, 512);
                }

                if (dto.WebsiteUrl is not null)
                {
                    profile.WebsiteUrl = Truncate(dto.WebsiteUrl, 512);
                }

                if (dto.Country is not null)
                {
                    profile.Country = Truncate(dto.Country, 64);
                }

                if (dto.TaxId is not null)
                {
                    profile.TaxId = Truncate(dto.TaxId, 32);
                }

                profile.UpdatedAt = DateTimeOffset.UtcNow;
            }

            await _db.SaveChangesAsync();
            return (ToDto(profile), 200, null);
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
                var members = await _db.Members.AsNoTracking()
                    .Where(m => missing.Contains(m.Id))
                    .Select(m => new { m.Id, m.FirstName, m.LastName })
                    .ToListAsync();

                foreach (var m in members)
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
            if (memberId is null or <= 0)
            {
                return null;
            }

            var map = await ResolveDisplayNamesAsync(new[] { memberId.Value });
            return map.TryGetValue(memberId.Value, out var name) ? name : null;
        }

        private async Task<IssuerProfile?> TryLazySeedFromApprovedApplicationAsync(int memberId, bool track = false)
        {
            var memberQuery = track ? _db.Members.AsQueryable() : _db.Members.AsNoTracking();
            var member = await memberQuery.FirstOrDefaultAsync(m => m.Id == memberId);
            if (member?.EthereumAddress is null || string.IsNullOrWhiteSpace(member.EthereumAddress))
            {
                return null;
            }

            var address = member.EthereumAddress.Trim().ToLowerInvariant();
            var application = await _db.IssuerApplications.AsNoTracking()
                .Where(a =>
                    a.Status == IssuerApplicationStatus.Approved
                    && a.EthereumAddress.ToLower() == address)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync();

            if (application is null)
            {
                return null;
            }

            await UpsertFromApplicationAsync(memberId, application.InstitutionName, application.Description);

            return track
                ? await _db.IssuerProfiles.FirstOrDefaultAsync(p => p.MemberId == memberId)
                : await _db.IssuerProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.MemberId == memberId);
        }

        private static IssuerProfileDto ToDto(IssuerProfile p) => new()
        {
            MemberId = p.MemberId,
            InstitutionName = p.InstitutionName,
            Description = p.Description,
            LogoUrl = p.LogoUrl,
            WebsiteUrl = p.WebsiteUrl,
            Country = p.Country,
            TaxId = p.TaxId,
            UpdatedAt = p.UpdatedAt,
        };

        private static string? FormatPersonName(string? first, string? last)
        {
            var parts = new[] { first?.Trim(), last?.Trim() }
                .Where(p => !string.IsNullOrWhiteSpace(p));
            var name = string.Join(' ', parts);
            return string.IsNullOrWhiteSpace(name) ? null : name;
        }

        private static string? Truncate(string? value, int max)
        {
            if (value is null)
            {
                return null;
            }

            var trimmed = value.Trim();
            if (trimmed.Length == 0)
            {
                return null;
            }

            return trimmed.Length <= max ? trimmed : trimmed[..max];
        }
    }
}
