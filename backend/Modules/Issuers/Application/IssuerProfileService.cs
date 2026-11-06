using backend.Infrastructure.Blockchain;
using backend.Infrastructure.Persistence;
using backend.Modules.Issuers.Contracts;
using backend.Modules.Issuers.Domain;
using backend.Modules.Members.Contracts;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Issuers.Application
{
    public class IssuerProfileService : IIssuerProfileService
    {
        private readonly AppDbContext _db;
        private readonly IMemberDirectory _members;
        private readonly IBlockchainService _blockchain;
        private readonly ILogger<IssuerProfileService> _logger;

        public IssuerProfileService(
            AppDbContext db,
            IMemberDirectory members,
            IBlockchainService blockchain,
            ILogger<IssuerProfileService> logger)
        {
            _db = db;
            _members = members;
            _blockchain = blockchain;
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

        public async Task<IssuerProfileDto?> GetByEthereumAddressAsync(string ethereumAddress)
        {
            if (string.IsNullOrWhiteSpace(ethereumAddress))
            {
                return null;
            }

            var member = await _members.FindByEthereumAddressAsync(ethereumAddress);
            if (member is null)
            {
                return null;
            }

            return await GetMyProfileAsync(member.Id);
        }

        public async Task<InstitutionListItemDto?> GetInstitutionByMemberIdAsync(int memberId)
        {
            if (memberId <= 0)
            {
                return null;
            }

            var profile = await _db.IssuerProfiles.AsNoTracking()
                .FirstOrDefaultAsync(p => p.MemberId == memberId);
            if (profile is null)
            {
                return null;
            }

            var member = await _members.FindByIdAsync(memberId);
            return ToListItem(profile, member?.EthereumAddress);
        }

        public async Task<IReadOnlyList<InstitutionListItemDto>> ListInstitutionsAsync(string? query, int limit = 100)
        {
            var take = Math.Clamp(limit, 1, 200);
            var q = query?.Trim() ?? string.Empty;

            var profilesQuery = _db.IssuerProfiles.AsNoTracking().AsQueryable();
            if (q.Length >= 2)
            {
                var pattern = q.ToLowerInvariant();
                profilesQuery = profilesQuery.Where(p =>
                    p.InstitutionName.ToLower().Contains(pattern)
                    || (p.Country != null && p.Country.ToLower().Contains(pattern))
                    || (p.Description != null && p.Description.ToLower().Contains(pattern))
                    || (p.TaxId != null && p.TaxId.ToLower().Contains(pattern)));
            }

            var profiles = await profilesQuery
                .OrderBy(p => p.InstitutionName)
                .Take(take)
                .ToListAsync();

            if (profiles.Count == 0)
            {
                return Array.Empty<InstitutionListItemDto>();
            }

            var members = await _members.GetByIdsAsync(profiles.Select(p => p.MemberId));
            return profiles
                .Select(p =>
                {
                    members.TryGetValue(p.MemberId, out var member);
                    return ToListItem(p, member?.EthereumAddress);
                })
                .ToList();
        }

        public async Task<IssuerOnChainVerifyDto> VerifyIssuerOnChainAsync(string ethereumAddress)
        {
            var address = ethereumAddress?.Trim().ToLowerInvariant() ?? string.Empty;
            var networkName = await _blockchain.GetNetworkNameAsync();

            if (string.IsNullOrWhiteSpace(address)
                || !address.StartsWith("0x", StringComparison.Ordinal)
                || address.Length != 42)
            {
                return new IssuerOnChainVerifyDto
                {
                    EthereumAddress = address,
                    IsIssuer = false,
                    NetworkName = networkName,
                    Message = "Nieprawidłowy adres Ethereum.",
                };
            }

            var isIssuer = await _blockchain.IsIssuerAsync(address);
            _logger.LogInformation(
                "Issuer on-chain verify for {Address}: isIssuer={IsIssuer}, network={Network}",
                address,
                isIssuer,
                networkName);

            return new IssuerOnChainVerifyDto
            {
                EthereumAddress = address,
                IsIssuer = isIssuer,
                NetworkName = networkName,
                Message = isIssuer
                    ? $"Zweryfikowany issuer ({networkName})"
                    : $"Ten adres nie jest authorized issuer on-chain ({networkName})",
            };
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

        private async Task<IssuerProfile?> TryLazySeedFromApprovedApplicationAsync(int memberId, bool track = false)
        {
            var member = await _members.FindByIdAsync(memberId);
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

        private static InstitutionListItemDto ToListItem(IssuerProfile p, string? ethereumAddress) => new()
        {
            MemberId = p.MemberId,
            InstitutionName = p.InstitutionName,
            Description = p.Description,
            LogoUrl = p.LogoUrl,
            WebsiteUrl = p.WebsiteUrl,
            Country = p.Country,
            TaxId = p.TaxId,
            UpdatedAt = p.UpdatedAt,
            EthereumAddress = string.IsNullOrWhiteSpace(ethereumAddress)
                ? null
                : ethereumAddress.Trim().ToLowerInvariant(),
        };

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
