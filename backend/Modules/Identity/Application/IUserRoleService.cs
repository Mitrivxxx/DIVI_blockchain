namespace backend.Modules.Identity.Application
{
	public interface IUserRoleService
	{
		string GetUserRole(string ethereumAddress);
	}
}
