using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services.Documents;
using backend.Services.Issuers;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Credentials
{
    public class CredentialWalletService : ICredentialWalletService
    {
        public const byte VisibilityPrivate = 0;
        public const byte VisibilityUnlisted = 1;
        public const byte VisibilityPublic = 2;
        public const byte StatusConfirmed = 1;

        private readonly AppDbContext _db;
        private readonly IIssuerProfileService _issuerProfileService;
        private readonly ILogger<CredentialWalletService> _logger;

        public CredentialWalletService(
            AppDbContext db,
            IIssuerProfileService issuerProfileService,
            ILogger<CredentialWalletService> logger)
        {
            _db = db;
            _issuerProfileService = issuerProfileService;
            _logger = logger;
        }

        public async Task<CredentialWalletDto> GetMyCredentialsAsync(int memberId)
        {
            var member = await _db.Members.AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == memberId);

            if (member?.EthereumAddress is null || string.IsNullOrWhiteSpace(member.EthereumAddress))
            {
                return EmptyOwnerWallet();
            }

            var address = member.EthereumAddress.Trim().ToLowerInvariant();
            var docs = await _db.Documents.AsNoTracking()
                .Where(d => d.OwnerAddress.ToLower() == address)
                .OrderByDescending(d => d.IssuedAt)
                .ToListAsync();

            var memberIds = docs.Where(d => d.IssuedByMemberId.HasValue).Select(d => d.IssuedByMemberId!.Value);
            var names = await _issuerProfileService.ResolveDisplayNamesAsync(memberIds);
            var logos = await ResolveLogoUrlsAsync(memberIds);

            var items = docs.Select(d => ToOwnerItem(d, names, logos)).ToList();
            return GroupOwnerWallet(items);
        }

        public async Task<(CredentialItemDto? Item, int StatusCode, string? Error)> UpdateVisibilityAsync(
            int memberId,
            string hash,
            string visibility)
        {
            if (!TryParseVisibility(visibility, out var visibilityByte))
            {
                return (null, 400, "visibility must be private, unlisted, or public");
            }

            var member = await _db.Members.AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == memberId);

            if (member?.EthereumAddress is null || string.IsNullOrWhiteSpace(member.EthereumAddress))
            {
                return (null, 400, "Member has no Ethereum address; cannot manage credentials");
            }

            var address = member.EthereumAddress.Trim().ToLowerInvariant();
            var normalizedHash = hash?.Trim() ?? string.Empty;

            var doc = await _db.Documents
                .FirstOrDefaultAsync(d => d.Hash == normalizedHash);

            if (doc is null)
            {
                return (null, 404, "Credential not found");
            }

            if (!string.Equals(doc.OwnerAddress, address, StringComparison.OrdinalIgnoreCase))
            {
                return (null, 403, "Only the document owner can change visibility");
            }

            doc.Visibility = visibilityByte;

            if (visibilityByte == VisibilityPrivate)
            {
                doc.ShareToken = null;
            }
            else if (visibilityByte == VisibilityUnlisted)
            {
                if (string.IsNullOrWhiteSpace(doc.ShareToken))
                {
                    doc.ShareToken = Guid.NewGuid().ToString("N");
                }
            }
            // public: keep existing ShareToken if any; do not require one

            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Credential {Hash} visibility set to {Visibility} by member {MemberId}",
                doc.Hash,
                VisibilityToString(doc.Visibility),
                memberId);

            var displayName = await _issuerProfileService.ResolveDisplayNameAsync(doc.IssuedByMemberId);
            var logoUrl = await ResolveLogoUrlAsync(doc.IssuedByMemberId);
            return (ToOwnerItem(doc, displayName, logoUrl), 200, null);
        }

        public async Task<PublicCredentialDto?> GetByShareTokenAsync(string token)
        {
            var normalized = token?.Trim();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return null;
            }

            var doc = await _db.Documents.AsNoTracking()
                .FirstOrDefaultAsync(d =>
                    d.ShareToken == normalized
                    && d.Status == StatusConfirmed
                    && (d.Visibility == VisibilityUnlisted || d.Visibility == VisibilityPublic));

            if (doc is null)
            {
                return null;
            }

            var displayName = await _issuerProfileService.ResolveDisplayNameAsync(doc.IssuedByMemberId);
            var logoUrl = await ResolveLogoUrlAsync(doc.IssuedByMemberId);
            return ToPublicItem(doc, displayName, logoUrl);
        }

        public async Task<PublicCredentialWalletDto> GetPublicCredentialsByAddressAsync(string ethereumAddress)
        {
            var address = ethereumAddress?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(address))
            {
                return EmptyPublicWallet();
            }

            var docs = await _db.Documents.AsNoTracking()
                .Where(d =>
                    d.OwnerAddress.ToLower() == address
                    && d.Visibility == VisibilityPublic
                    && d.Status == StatusConfirmed)
                .OrderByDescending(d => d.IssuedAt)
                .ToListAsync();

            var memberIds = docs.Where(d => d.IssuedByMemberId.HasValue).Select(d => d.IssuedByMemberId!.Value);
            var names = await _issuerProfileService.ResolveDisplayNamesAsync(memberIds);
            var logos = await ResolveLogoUrlsAsync(memberIds);

            var items = docs.Select(d => ToPublicItem(d, names, logos)).ToList();
            return GroupPublicWallet(items);
        }

        private static CredentialWalletDto EmptyOwnerWallet() => GroupOwnerWallet(Array.Empty<CredentialItemDto>());

        private static PublicCredentialWalletDto EmptyPublicWallet() =>
            GroupPublicWallet(Array.Empty<PublicCredentialDto>());

        private static CredentialWalletDto GroupOwnerWallet(IReadOnlyList<CredentialItemDto> items)
        {
            var byType = items.GroupBy(i => i.DocumentType).ToDictionary(g => g.Key, g => g.ToList());

            return new CredentialWalletDto
            {
                Sections = DocumentTypeCatalog.All.Select(info => new CredentialSectionDto
                {
                    DocumentType = info.Id,
                    Label = info.LabelPl,
                    Items = byType.TryGetValue(info.Id, out var list)
                        ? list
                        : Array.Empty<CredentialItemDto>(),
                }).ToList(),
            };
        }

        private static PublicCredentialWalletDto GroupPublicWallet(IReadOnlyList<PublicCredentialDto> items)
        {
            var byType = items.GroupBy(i => i.DocumentType).ToDictionary(g => g.Key, g => g.ToList());

            return new PublicCredentialWalletDto
            {
                Sections = DocumentTypeCatalog.All.Select(info => new PublicCredentialSectionDto
                {
                    DocumentType = info.Id,
                    Label = info.LabelPl,
                    Items = byType.TryGetValue(info.Id, out var list)
                        ? list
                        : Array.Empty<PublicCredentialDto>(),
                }).ToList(),
            };
        }

        private static bool TryParseVisibility(string? value, out byte visibility)
        {
            visibility = VisibilityPrivate;
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            switch (value.Trim().ToLowerInvariant())
            {
                case "private":
                    visibility = VisibilityPrivate;
                    return true;
                case "unlisted":
                    visibility = VisibilityUnlisted;
                    return true;
                case "public":
                    visibility = VisibilityPublic;
                    return true;
                default:
                    return false;
            }
        }

        private static string VisibilityToString(byte visibility) => visibility switch
        {
            VisibilityUnlisted => "unlisted",
            VisibilityPublic => "public",
            _ => "private",
        };

        /// <summary>
        /// Prefer institution LogoUrl; fall back to the issuing member's AvatarUrl (profile photo).
        /// </summary>
        private async Task<IReadOnlyDictionary<int, string?>> ResolveLogoUrlsAsync(IEnumerable<int> memberIds)
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
                var avatars = await _db.Members.AsNoTracking()
                    .Where(m => missingIds.Contains(m.Id))
                    .Select(m => new { m.Id, m.AvatarUrl })
                    .ToListAsync();

                foreach (var row in avatars)
                {
                    if (string.IsNullOrWhiteSpace(row.AvatarUrl))
                    {
                        continue;
                    }

                    logoByMember[row.Id] = row.AvatarUrl.Trim();
                }
            }

            foreach (var id in ids)
            {
                if (!logoByMember.ContainsKey(id))
                {
                    logoByMember[id] = null;
                }
            }

            return logoByMember;
        }

        private async Task<string?> ResolveLogoUrlAsync(int? memberId)
        {
            if (memberId is not int id || id <= 0)
            {
                return null;
            }

            var map = await ResolveLogoUrlsAsync(new[] { id });
            return map.TryGetValue(id, out var url) ? url : null;
        }

        private static CredentialItemDto ToOwnerItem(
            Document d,
            IReadOnlyDictionary<int, string?> names,
            IReadOnlyDictionary<int, string?> logos)
        {
            string? displayName = null;
            string? logoUrl = null;
            if (d.IssuedByMemberId is int mid)
            {
                names.TryGetValue(mid, out displayName);
                logos.TryGetValue(mid, out logoUrl);
            }

            return ToOwnerItem(d, displayName, logoUrl);
        }

        private static CredentialItemDto ToOwnerItem(Document d, string? displayName, string? logoUrl = null) => new()
        {
            Hash = d.Hash,
            DocumentType = d.DocumentType,
            Status = d.Status,
            IssuedAt = d.IssuedAt,
            PeriodStart = d.PeriodStart,
            ExpiresAt = d.ExpiresAt,
            Title = d.Title,
            IssuerAddress = d.IssuerAddress,
            OwnerAddress = d.OwnerAddress,
            TxHash = d.TxHash,
            BlockNumber = d.BlockNumber,
            Visibility = VisibilityToString(d.Visibility),
            ShareToken = d.ShareToken,
            Cid = d.Cid,
            IssuedByMemberId = d.IssuedByMemberId,
            IssuerDisplayName = displayName,
            IssuerLogoUrl = logoUrl,
        };

        private static PublicCredentialDto ToPublicItem(
            Document d,
            IReadOnlyDictionary<int, string?> names,
            IReadOnlyDictionary<int, string?> logos)
        {
            string? displayName = null;
            string? logoUrl = null;
            if (d.IssuedByMemberId is int mid)
            {
                names.TryGetValue(mid, out displayName);
                logos.TryGetValue(mid, out logoUrl);
            }

            return ToPublicItem(d, displayName, logoUrl);
        }

        private static PublicCredentialDto ToPublicItem(Document d, string? displayName, string? logoUrl = null) => new()
        {
            Hash = d.Hash,
            DocumentType = d.DocumentType,
            Status = d.Status,
            IssuedAt = d.IssuedAt,
            PeriodStart = d.PeriodStart,
            ExpiresAt = d.ExpiresAt,
            Title = d.Title,
            IssuerAddress = d.IssuerAddress,
            OwnerAddress = d.OwnerAddress,
            TxHash = d.TxHash,
            BlockNumber = d.BlockNumber,
            Visibility = VisibilityToString(d.Visibility),
            IssuedByMemberId = d.IssuedByMemberId,
            IssuerDisplayName = displayName,
            IssuerLogoUrl = logoUrl,
        };
    }
}
