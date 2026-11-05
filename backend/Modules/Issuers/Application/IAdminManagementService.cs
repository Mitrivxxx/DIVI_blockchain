namespace backend.Modules.Issuers.Application
{
	public interface IAdminManagementService
	{
		Task<(bool Ok, string? Error)> AddAdminAsync(string ethereumAddress);
		Task<(bool Ok, string? Error)> RemoveAdminAsync(string ethereumAddress);
	}
}
