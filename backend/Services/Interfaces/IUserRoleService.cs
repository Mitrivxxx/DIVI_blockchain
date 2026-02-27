using backend.Services;

namespace backend.Services
{
    public interface IUserRoleService
    {
        UserRole GetUserRole(string ethereumAddress);
    }
}
