using backend.Infrastructure.Persistence;
using Google.Apis.Auth;
using backend.Modules.Members.Domain;
using Microsoft.EntityFrameworkCore;


namespace backend.Modules.Identity.Application
{
    public class UserService
    {
        private readonly AppDbContext _db;

        public UserService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Member> GetOrCreateGoogleUser(GoogleJsonWebSignature.Payload payload)
        {
            var user = await _db.Members
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.GoogleSub == payload.Subject);

            if (user != null)
                return user;

            user = new Member
            {
                GoogleSub = payload.Subject,
                Email = payload.Email,
                FirstName = payload.GivenName,
                LastName = payload.FamilyName,
                MemberRoleId = 3, // Default User role
                CreatedAt = DateTime.UtcNow
            };

            _db.Members.Add(user);
            await _db.SaveChangesAsync();

            // Load the role for the new user
            await _db.Entry(user).Reference(u => u.Role).LoadAsync();

            return user;
        }
    }
}