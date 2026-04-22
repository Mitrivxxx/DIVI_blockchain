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
				_logger.LogDebug("No member found for address {EthereumAddress}; defaulting to role User", normalizedAddress);
				return "User";
			}

			var roleName = member.Role?.Name ?? "User";
			_logger.LogDebug("Member found for address {EthereumAddress} with DB role {MemberRole}", normalizedAddress, roleName);

			switch (roleName)
			{
				case "Admin":
					_logger.LogDebug("Mapped address {EthereumAddress} to app role Admin", normalizedAddress);
					return "Admin";
				case "Issuer":
					_logger.LogDebug("Mapped address {EthereumAddress} to app role Issuer", normalizedAddress);
					return "Issuer";
				default:
					_logger.LogDebug("Mapped address {EthereumAddress} to default app role User", normalizedAddress);
					return "User";
			}
		}
	}
}