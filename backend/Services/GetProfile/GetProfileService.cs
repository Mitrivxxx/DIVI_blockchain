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
                Role = member.Role.ToString(),
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

        private async Task<Member?> GetMemberByAddressAsync(string ethereumAddress, bool asNoTracking)
        {
            var normalizedAddress = ethereumAddress.ToLowerInvariant();
            _logger.LogDebug("GetMemberByAddressAsync resolving address {EthereumAddress} (asNoTracking: {AsNoTracking})", normalizedAddress, asNoTracking);
            var query = _context.Members.Where(m => m.EthereumAddress.ToLower() == normalizedAddress);

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync();
        }
    }
}
