using backend.Data;
using backend.Services.Blockchain;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace backend.Services.Admins
{
	public class AdminManagementService : IAdminManagementService
	{
		private const int AdminRoleId = 1;
		private const int UserRoleId = 3;
		private const int OwnerRoleId = 4;

		private readonly AppDbContext _db;
		private readonly IBlockchainService _blockchainService;

		public AdminManagementService(AppDbContext db, IBlockchainService blockchainService)
		{
			_db = db;
			_blockchainService = blockchainService;
		}

		public async Task<(bool Ok, string? Error)> AddAdminAsync(string ethereumAddress)
		{
			var normalized = ethereumAddress?.Trim();
			if (string.IsNullOrWhiteSpace(normalized))
			{
				return (false, "Ethereum address is required.");
			}

			var member = await FindMemberByAddressAsync(normalized);
			if (member is null)
			{
				return (false, "No Member found for this Ethereum address.");
			}

			if (member.MemberRoleId == OwnerRoleId)
			{
				return (false, "Owner cannot be assigned the admin role.");
			}

			try
			{
				await _blockchainService.AddAdminAsync(normalized);
			}
			catch (Exception ex)
			{
				Log.Error(ex, "[AdminManagementService] AddAdmin chain failed for {Address}", normalized);
				return (false, $"Blockchain error: {ex.Message}");
			}

			member.MemberRoleId = AdminRoleId;
			await _db.SaveChangesAsync();
			return (true, null);
		}

		public async Task<(bool Ok, string? Error)> RemoveAdminAsync(string ethereumAddress)
		{
			var normalized = ethereumAddress?.Trim();
			if (string.IsNullOrWhiteSpace(normalized))
			{
				return (false, "Ethereum address is required.");
			}

			var member = await FindMemberByAddressAsync(normalized);
			if (member is null)
			{
				return (false, "No Member found for this Ethereum address.");
			}

			if (member.MemberRoleId == OwnerRoleId)
			{
				return (false, "Cannot remove owner.");
			}

			try
			{
				await _blockchainService.RemoveAdminAsync(normalized);
			}
			catch (Exception ex)
			{
				Log.Error(ex, "[AdminManagementService] RemoveAdmin chain failed for {Address}", normalized);
				return (false, $"Blockchain error: {ex.Message}");
			}

			member.MemberRoleId = UserRoleId;
			await _db.SaveChangesAsync();
			return (true, null);
		}

		private Task<Models.Member?> FindMemberByAddressAsync(string ethereumAddress)
		{
			var lower = ethereumAddress.ToLowerInvariant();
			return _db.Members.FirstOrDefaultAsync(m =>
				m.EthereumAddress != null &&
				m.EthereumAddress.ToLower() == lower);
		}
	}
}
