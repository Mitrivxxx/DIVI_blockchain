using backend.Models;
using backend.Data;
using Microsoft.Extensions.Logging;

namespace backend.Services.Roles
{
	public enum UserRole
	{
		Admin,
		Issuer,
		User
	}

	public class UserRoleService : IUserRoleService
	{
		private readonly AppDbContext _db;
		private readonly ILogger<UserRoleService> _logger;

		public UserRoleService(AppDbContext db, ILogger<UserRoleService> logger)
		{
			_db = db;
			_logger = logger;
		}

		public UserRole GetUserRole(string ethereumAddress)
		{
			ethereumAddress = ethereumAddress.ToLower();
			_logger.LogDebug("Resolving role for address {EthereumAddress}", ethereumAddress);

			var member = _db.Members.FirstOrDefault(m => m.EthereumAddress.ToLower() == ethereumAddress);
			if (member != null)
			{
				_logger.LogDebug("Member found for address {EthereumAddress} with DB role {MemberRole}", ethereumAddress, member.Role);

				switch (member.Role)
				{
					case MemberRole.Admin:
						_logger.LogDebug("Mapped address {EthereumAddress} to app role {UserRole}", ethereumAddress, UserRole.Admin);
						return UserRole.Admin;
					case MemberRole.Issuer:
						_logger.LogDebug("Mapped address {EthereumAddress} to app role {UserRole}", ethereumAddress, UserRole.Issuer);
						return UserRole.Issuer;
					default:
						_logger.LogDebug("Mapped address {EthereumAddress} to default app role {UserRole}", ethereumAddress, UserRole.User);
						return UserRole.User;
				}
			}

			_logger.LogDebug("No member found for address {EthereumAddress}; defaulting to role {UserRole}", ethereumAddress, UserRole.User);
			return UserRole.User;
		}
	}
}
