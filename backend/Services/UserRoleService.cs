using backend.Models;
using backend.Data;

namespace backend.Services
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

        public UserRoleService(AppDbContext db)
        {
            _db = db;
        }

        public UserRole GetUserRole(string ethereumAddress)
        {
            if (_db.Admin.Any(a => a.EthereumAddress == ethereumAddress))
                return UserRole.Admin;

            if (_db.IssuerApplications.Any(i => i.EthereumAddress == ethereumAddress && i.Status == IssuerApplicationStatus.Approved))
                return UserRole.Issuer;

            return UserRole.User;
        }
    }
}
