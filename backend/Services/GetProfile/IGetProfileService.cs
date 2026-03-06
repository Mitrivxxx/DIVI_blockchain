using backend.DTOs;

namespace backend.Services.GetProfile
{
    public interface IGetProfileService
    {
        Task<MemberProfileDto?> GetProfileByAddressAsync(string ethereumAddress);
        Task<bool> UpdateNameAsync(string ethereumAddress, string name);
        Task<bool> UpdateEmailAsync(string ethereumAddress, string email);
        Task<bool> UpdateBioAsync(string ethereumAddress, string bio);
        Task<bool> DeleteNameAsync(string ethereumAddress);
        Task<bool> DeleteEmailAsync(string ethereumAddress);
        Task<bool> DeleteBioAsync(string ethereumAddress);
    }
}
