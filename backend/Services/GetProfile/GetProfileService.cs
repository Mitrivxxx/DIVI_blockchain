using backend.Data;
using backend.DTOs;
using backend.Infrastructure.Minio;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.GetProfile
{
    public class GetProfileService : IGetProfileService
    {
        private const long MaxAvatarBytes = 2 * 1024 * 1024;
        private static readonly HashSet<string> AllowedAvatarContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp",
        };

        private readonly AppDbContext _context;
        private readonly IMinioObjectStorage _objectStorage;
        private readonly ILogger<GetProfileService> _logger;

        public GetProfileService(
            AppDbContext context,
            IMinioObjectStorage objectStorage,
            ILogger<GetProfileService> logger)
        {
            _context = context;
            _objectStorage = objectStorage;
            _logger = logger;
        }

        public async Task<MemberProfileDto?> GetProfileByAddressAsync(string ethereumAddress)
        {
            _logger.LogDebug("GetProfileByAddressAsync called for address {EthereumAddress}", ethereumAddress);
            var member = await GetMemberByAddressAsync(ethereumAddress, asNoTracking: true);
            if (member is null)
            {
                _logger.LogDebug("GetProfileByAddressAsync: member not found for address {EthereumAddress}", ethereumAddress);
                return null;
            }

            _logger.LogDebug("GetProfileByAddressAsync: member found for address {EthereumAddress}", ethereumAddress);

            return new MemberProfileDto
            {
                FirstName = member.FirstName,
                LastName = member.LastName,
                EthereumAddress = member.EthereumAddress,
                Role = member.Role.Name,
                Email = member.Email,
                Bio = member.Bio,
                AvatarUrl = member.AvatarUrl,
                CreatedAt = member.CreatedAt
            };
        }

        public async Task<MemberProfileDto?> GetProfileByIdAsync(int memberId)
        {
            _logger.LogDebug("GetProfileByIdAsync called for memberId {MemberId}", memberId);
            var member = await GetMemberByIdAsync(memberId, asNoTracking: true);
            if (member is null)
            {
                _logger.LogDebug("GetProfileByIdAsync: member not found for memberId {MemberId}", memberId);
                return null;
            }

            _logger.LogDebug("GetProfileByIdAsync: member found for memberId {MemberId}", memberId);

            return new MemberProfileDto
            {
                FirstName = member.FirstName,
                LastName = member.LastName,
                EthereumAddress = member.EthereumAddress,
                Role = member.Role.Name,
                Email = member.Email,
                Bio = member.Bio,
                AvatarUrl = member.AvatarUrl,
                CreatedAt = member.CreatedAt
            };
        }

        public async Task<IReadOnlyList<MemberSearchResultDto>> SearchMembersAsync(string query, int limit = 10)
        {
            var trimmed = query?.Trim() ?? string.Empty;
            if (trimmed.Length < 2)
            {
                return Array.Empty<MemberSearchResultDto>();
            }

            var take = Math.Clamp(limit, 1, 25);
            var needle = trimmed.ToLowerInvariant();

            _logger.LogDebug("SearchMembersAsync query length {Length}, limit {Limit}", trimmed.Length, take);

            var members = await _context.Members
                .AsNoTracking()
                .Include(m => m.Role)
                .Where(m => m.EthereumAddress != null && m.EthereumAddress != "")
                .Where(m =>
                    (m.EthereumAddress != null && m.EthereumAddress.ToLower().Contains(needle))
                    || (m.FirstName != null && m.FirstName.ToLower().Contains(needle))
                    || (m.LastName != null && m.LastName.ToLower().Contains(needle))
                    || ((m.FirstName ?? "") + " " + (m.LastName ?? "")).ToLower().Contains(needle))
                .OrderBy(m => m.FirstName)
                .ThenBy(m => m.LastName)
                .ThenBy(m => m.EthereumAddress)
                .Take(take)
                .ToListAsync();

            return members.Select(ToSearchResult).ToList();
        }

        public async Task<IReadOnlyList<MemberSearchResultDto>> ListMembersAsync(int limit = 200)
        {
            var take = Math.Clamp(limit, 1, 500);
            _logger.LogDebug("ListMembersAsync limit {Limit}", take);

            var members = await _context.Members
                .AsNoTracking()
                .Include(m => m.Role)
                .OrderBy(m => m.Role.Id == 4 ? 0 : m.Role.Id == 1 ? 1 : m.Role.Id == 2 ? 2 : 3)
                .ThenBy(m => m.FirstName)
                .ThenBy(m => m.LastName)
                .ThenBy(m => m.Id)
                .Take(take)
                .ToListAsync();

            return members.Select(ToSearchResult).ToList();
        }

        private static MemberSearchResultDto ToSearchResult(Member m) => new()
        {
            MemberId = m.Id,
            FirstName = m.FirstName,
            LastName = m.LastName,
            EthereumAddress = m.EthereumAddress ?? string.Empty,
            Role = m.Role.Name,
            AvatarUrl = m.AvatarUrl,
        };

        public async Task<bool> UpdateNameAsync(string ethereumAddress, string firstName, string? lastName)
        {
            _logger.LogDebug("UpdateNameAsync called for address {EthereumAddress}", ethereumAddress);
            var member = await GetMemberByAddressAsync(ethereumAddress, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("UpdateNameAsync: member not found for address {EthereumAddress}", ethereumAddress);
                return false;
            }

            member.FirstName = firstName.Trim();
            member.LastName = string.IsNullOrWhiteSpace(lastName) ? null : lastName.Trim();
            await _context.SaveChangesAsync();
            _logger.LogDebug("UpdateNameAsync succeeded for address {EthereumAddress}", ethereumAddress);
            return true;
        }

        public async Task<bool> UpdateEmailAsync(string ethereumAddress, string email)
        {
            _logger.LogDebug("UpdateEmailAsync called for address {EthereumAddress}", ethereumAddress);
            var member = await GetMemberByAddressAsync(ethereumAddress, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("UpdateEmailAsync: member not found for address {EthereumAddress}", ethereumAddress);
                return false;
            }

            member.Email = email.Trim();
            await _context.SaveChangesAsync();
            _logger.LogDebug("UpdateEmailAsync succeeded for address {EthereumAddress}", ethereumAddress);
            return true;
        }

        public async Task<bool> UpdateBioAsync(string ethereumAddress, string bio)
        {
            _logger.LogDebug("UpdateBioAsync called for address {EthereumAddress}", ethereumAddress);
            var member = await GetMemberByAddressAsync(ethereumAddress, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("UpdateBioAsync: member not found for address {EthereumAddress}", ethereumAddress);
                return false;
            }

            member.Bio = bio.Trim();
            await _context.SaveChangesAsync();
            _logger.LogDebug("UpdateBioAsync succeeded for address {EthereumAddress}", ethereumAddress);
            return true;
        }

        public async Task<bool> DeleteNameAsync(string ethereumAddress)
        {
            _logger.LogDebug("DeleteNameAsync called for address {EthereumAddress}", ethereumAddress);
            var member = await GetMemberByAddressAsync(ethereumAddress, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("DeleteNameAsync: member not found for address {EthereumAddress}", ethereumAddress);
                return false;
            }

            member.FirstName = null;
            member.LastName = null;
            await _context.SaveChangesAsync();
            _logger.LogDebug("DeleteNameAsync succeeded for address {EthereumAddress}", ethereumAddress);
            return true;
        }

        public async Task<bool> DeleteEmailAsync(string ethereumAddress)
        {
            _logger.LogDebug("DeleteEmailAsync called for address {EthereumAddress}", ethereumAddress);
            var member = await GetMemberByAddressAsync(ethereumAddress, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("DeleteEmailAsync: member not found for address {EthereumAddress}", ethereumAddress);
                return false;
            }

            member.Email = null;
            await _context.SaveChangesAsync();
            _logger.LogDebug("DeleteEmailAsync succeeded for address {EthereumAddress}", ethereumAddress);
            return true;
        }

        public async Task<bool> DeleteBioAsync(string ethereumAddress)
        {
            _logger.LogDebug("DeleteBioAsync called for address {EthereumAddress}", ethereumAddress);
            var member = await GetMemberByAddressAsync(ethereumAddress, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("DeleteBioAsync: member not found for address {EthereumAddress}", ethereumAddress);
                return false;
            }

            member.Bio = null;
            await _context.SaveChangesAsync();
            _logger.LogDebug("DeleteBioAsync succeeded for address {EthereumAddress}", ethereumAddress);
            return true;
        }

        public async Task<bool> UpdateNameByIdAsync(int memberId, string firstName, string? lastName)
        {
            _logger.LogDebug("UpdateNameByIdAsync called for memberId {MemberId}", memberId);
            var member = await GetMemberByIdAsync(memberId, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("UpdateNameByIdAsync: member not found for memberId {MemberId}", memberId);
                return false;
            }

            member.FirstName = firstName.Trim();
            member.LastName = string.IsNullOrWhiteSpace(lastName) ? null : lastName.Trim();
            await _context.SaveChangesAsync();
            _logger.LogDebug("UpdateNameByIdAsync succeeded for memberId {MemberId}", memberId);
            return true;
        }

        public async Task<bool> UpdateEmailByIdAsync(int memberId, string email)
        {
            _logger.LogDebug("UpdateEmailByIdAsync called for memberId {MemberId}", memberId);
            var member = await GetMemberByIdAsync(memberId, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("UpdateEmailByIdAsync: member not found for memberId {MemberId}", memberId);
                return false;
            }

            member.Email = email.Trim();
            await _context.SaveChangesAsync();
            _logger.LogDebug("UpdateEmailByIdAsync succeeded for memberId {MemberId}", memberId);
            return true;
        }

        public async Task<bool> UpdateBioByIdAsync(int memberId, string bio)
        {
            _logger.LogDebug("UpdateBioByIdAsync called for memberId {MemberId}", memberId);
            var member = await GetMemberByIdAsync(memberId, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("UpdateBioByIdAsync: member not found for memberId {MemberId}", memberId);
                return false;
            }

            member.Bio = bio.Trim();
            await _context.SaveChangesAsync();
            _logger.LogDebug("UpdateBioByIdAsync succeeded for memberId {MemberId}", memberId);
            return true;
        }

        public async Task<bool> DeleteNameByIdAsync(int memberId)
        {
            _logger.LogDebug("DeleteNameByIdAsync called for memberId {MemberId}", memberId);
            var member = await GetMemberByIdAsync(memberId, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("DeleteNameByIdAsync: member not found for memberId {MemberId}", memberId);
                return false;
            }

            member.FirstName = null;
            member.LastName = null;
            await _context.SaveChangesAsync();
            _logger.LogDebug("DeleteNameByIdAsync succeeded for memberId {MemberId}", memberId);
            return true;
        }

        public async Task<bool> DeleteEmailByIdAsync(int memberId)
        {
            _logger.LogDebug("DeleteEmailByIdAsync called for memberId {MemberId}", memberId);
            var member = await GetMemberByIdAsync(memberId, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("DeleteEmailByIdAsync: member not found for memberId {MemberId}", memberId);
                return false;
            }

            member.Email = null;
            await _context.SaveChangesAsync();
            _logger.LogDebug("DeleteEmailByIdAsync succeeded for memberId {MemberId}", memberId);
            return true;
        }

        public async Task<bool> DeleteBioByIdAsync(int memberId)
        {
            _logger.LogDebug("DeleteBioByIdAsync called for memberId {MemberId}", memberId);
            var member = await GetMemberByIdAsync(memberId, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("DeleteBioByIdAsync: member not found for memberId {MemberId}", memberId);
                return false;
            }

            member.Bio = null;
            await _context.SaveChangesAsync();
            _logger.LogDebug("DeleteBioByIdAsync succeeded for memberId {MemberId}", memberId);
            return true;
        }

        public async Task<(string? AvatarUrl, int StatusCode, string? Error)> UploadAvatarByIdAsync(
            int memberId,
            IFormFile file)
        {
            if (file is null || file.Length == 0)
            {
                return (null, 400, "Plik avatara jest wymagany.");
            }

            if (file.Length > MaxAvatarBytes)
            {
                return (null, 400, "Avatar może mieć maksymalnie 2 MB.");
            }

            var contentType = file.ContentType?.Trim() ?? string.Empty;
            if (!AllowedAvatarContentTypes.Contains(contentType))
            {
                return (null, 400, "Dozwolone formaty: JPEG, PNG, WebP.");
            }

            var member = await GetMemberByIdAsync(memberId, asNoTracking: false);
            if (member is null)
            {
                return (null, 404, "Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            try
            {
                await _objectStorage.DeleteObjectsByPrefixAsync(AvatarObjectKeys.Prefix(memberId));

                await using var uploadStream = file.OpenReadStream();
                var objectKey = AvatarObjectKeys.ForMember(memberId, contentType);
                var publicUrl = await _objectStorage.PutObjectAsync(objectKey, uploadStream, contentType);

                member.AvatarUrl = publicUrl;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Avatar uploaded to MinIO for memberId {MemberId}", memberId);
                return (publicUrl, 200, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Avatar upload to MinIO failed for memberId {MemberId}", memberId);
                return (null, 502, "Nie udało się zapisać avatara w magazynie obiektów.");
            }
        }

        public async Task<(bool Ok, string? PublicUrl, int StatusCode)> ResolveAvatarPublicUrlAsync(int memberId)
        {
            var member = await GetMemberByIdAsync(memberId, asNoTracking: true);
            var url = member?.AvatarUrl?.Trim();
            if (string.IsNullOrWhiteSpace(url))
            {
                return (false, null, 404);
            }

            return (true, url, 200);
        }

        public async Task<(bool Ok, int StatusCode, string? Error)> DeleteAvatarByIdAsync(int memberId)
        {
            var member = await GetMemberByIdAsync(memberId, asNoTracking: false);
            if (member is null)
            {
                return (false, 404, "Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            try
            {
                await _objectStorage.DeleteObjectsByPrefixAsync(AvatarObjectKeys.Prefix(memberId));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete MinIO avatar objects for memberId {MemberId}", memberId);
            }

            member.AvatarUrl = null;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Avatar deleted for memberId {MemberId}", memberId);
            return (true, 200, null);
        }

        private async Task<Member?> GetMemberByAddressAsync(string ethereumAddress, bool asNoTracking)
        {
            var normalizedAddress = ethereumAddress.ToLowerInvariant();
            _logger.LogDebug("GetMemberByAddressAsync resolving address {EthereumAddress} (asNoTracking: {AsNoTracking})", normalizedAddress, asNoTracking);
            var query = _context.Members
                .Include(m => m.Role)
                .Where(m => m.EthereumAddress != null && m.EthereumAddress.ToLower() == normalizedAddress);

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync();
        }

        private async Task<Member?> GetMemberByIdAsync(int memberId, bool asNoTracking)
        {
            _logger.LogDebug("GetMemberByIdAsync resolving memberId {MemberId} (asNoTracking: {AsNoTracking})", memberId, asNoTracking);
            var query = _context.Members
                .Include(m => m.Role)
                .Where(m => m.Id == memberId);

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync();
        }
    }
}
