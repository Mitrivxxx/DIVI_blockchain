using backend.BuildingBlocks;
using backend.Infrastructure.Blockchain;
using backend.Modules.Members.Contracts;
using Serilog;

namespace backend.Modules.Issuers.Application
{
	public class AdminManagementService : IAdminManagementService
	{
		private readonly IMemberDirectory _members;
		private readonly IBlockchainService _blockchainService;

		public AdminManagementService(IMemberDirectory members, IBlockchainService blockchainService)
		{
			_members = members;
			_blockchainService = blockchainService;
		}

		public async Task<(bool Ok, string? Error)> AddAdminAsync(string ethereumAddress)
		{
			var normalized = ethereumAddress?.Trim();
			if (string.IsNullOrWhiteSpace(normalized))
			{
				return (false, "Ethereum address is required.");
			}

			var member = await _members.FindByEthereumAddressAsync(normalized);
			if (member is null)
			{
				return (false, "No Member found for this Ethereum address.");
			}

			if (member.MemberRoleId == MemberRoles.OwnerId)
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

			await _members.SetRoleAsync(member.Id, MemberRoles.AdminId);
			return (true, null);
		}

		public async Task<(bool Ok, string? Error)> RemoveAdminAsync(string ethereumAddress)
		{
			var normalized = ethereumAddress?.Trim();
			if (string.IsNullOrWhiteSpace(normalized))
			{
				return (false, "Ethereum address is required.");
			}

			var member = await _members.FindByEthereumAddressAsync(normalized);
			if (member is null)
			{
				return (false, "No Member found for this Ethereum address.");
			}

			if (member.MemberRoleId == MemberRoles.OwnerId)
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

			await _members.SetRoleAsync(member.Id, MemberRoles.UserId);
			return (true, null);
		}
	}
}
