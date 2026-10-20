using backend.DTOs;
using backend.Services.Admins;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
	[ApiController]
	[Route("api/admins")]
	[Authorize(Roles = "owner")]
	public class AdminController : ControllerBase
	{
		private readonly IAdminManagementService _adminManagementService;

		public AdminController(IAdminManagementService adminManagementService)
		{
			_adminManagementService = adminManagementService;
		}

		/// <summary>
		/// Owner-only: grant admin role (DB + on-chain isAdmin).
		/// </summary>
		[HttpPost]
		public async Task<IActionResult> AddAdmin([FromBody] AdminAddressDto dto)
		{
			var (ok, error) = await _adminManagementService.AddAdminAsync(dto.EthereumAddress);
			if (!ok)
			{
				return BadRequest(error);
			}
			return NoContent();
		}

		/// <summary>
		/// Owner-only: revoke admin role (DB → user + on-chain removeAdmin).
		/// </summary>
		[HttpDelete("{ethereumAddress}")]
		public async Task<IActionResult> RemoveAdmin(string ethereumAddress)
		{
			var (ok, error) = await _adminManagementService.RemoveAdminAsync(ethereumAddress);
			if (!ok)
			{
				return BadRequest(error);
			}
			return NoContent();
		}
	}
}
