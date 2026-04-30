using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.GetProfile
{
    public class GetProfileService : IGetProfileService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<GetProfileService> _logger;

        public GetProfileService(AppDbContext context, ILogger<GetProfileService> logger)
        {
            _context = context;
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
                Name = member.Name,
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
                Name = member.Name,
                EthereumAddress = member.EthereumAddress,
                Role = member.Role.Name,
                Email = member.Email,
                Bio = member.Bio,
                AvatarUrl = member.AvatarUrl,
                CreatedAt = member.CreatedAt
            };
        }

        public async Task<bool> UpdateNameAsync(string ethereumAddress, string name)
        {
            _logger.LogDebug("UpdateNameAsync called for address {EthereumAddress}", ethereumAddress);
            var member = await GetMemberByAddressAsync(ethereumAddress, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("UpdateNameAsync: member not found for address {EthereumAddress}", ethereumAddress);
                return false;
            }

            member.Name = name.Trim();
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

            member.Name = null;
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

        public async Task<bool> UpdateNameByIdAsync(int memberId, string name)
        {
            _logger.LogDebug("UpdateNameByIdAsync called for memberId {MemberId}", memberId);
            var member = await GetMemberByIdAsync(memberId, asNoTracking: false);
            if (member is null)
            {
                _logger.LogDebug("UpdateNameByIdAsync: member not found for memberId {MemberId}", memberId);
                return false;
            }

            member.Name = name.Trim();
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

            member.Name = null;
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
