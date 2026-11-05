using Google.Apis.Auth;
using backend.Modules.Members.Contracts;


namespace backend.Modules.Identity.Application
{
    public class UserService
    {
        private readonly IMemberDirectory _members;

        public UserService(IMemberDirectory members)
        {
            _members = members;
        }

        public async Task<MemberAccount> GetOrCreateGoogleUser(GoogleJsonWebSignature.Payload payload)
        {
            var user = await _members.FindByGoogleSubAsync(payload.Subject);
            if (user != null)
                return user;

            return await _members.CreateAsync(new NewMemberAccount
            {
                GoogleSub = payload.Subject,
                Email = payload.Email,
                FirstName = payload.GivenName,
                LastName = payload.FamilyName,
            });
        }
    }
}
