using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace backend.Services.Roles
{
	public class UserRoleService : IUserRoleService
	{
		private readonly AppDbContext _db;
		private readonly ILogger<UserRoleService> _logger;

		public UserRoleService(AppDbContext db, ILogger<UserRoleService> logger)
		{
			_db = db;
			_logger = logger;
		}

		public string GetUserRole(string ethereumAddress)
		{
			var normalizedAddress = ethereumAddress.ToLowerInvariant();
			_logger.LogDebug("Resolving role for address {EthereumAddress}", normalizedAddress);

			var member = _db.Members
				.Include(m => m.Role)
				.FirstOrDefault(m => m.EthereumAddress != null && m.EthereumAddress.ToLower() == normalizedAddress);

			if (member is null)
			{
				_logger.LogDebug("No member found for address {EthereumAddress}; defaulting to role user", normalizedAddress);
				return "user";
			}

			var roleName = (member.Role?.Name ?? "user").ToLowerInvariant();
			_logger.LogDebug("Member found for address {EthereumAddress} with role {MemberRole}", normalizedAddress, roleName);
			return roleName;
		}
	}
}