using backend.DTOs;

namespace backend.Services.GetProfile
{
    public interface IGetProfileService
    {
        Task<MemberProfileDto?> GetProfileByAddressAsync(string ethereumAddress);
        Task<MemberProfileDto?> GetProfileByIdAsync(int memberId);
        Task<bool> UpdateNameAsync(string ethereumAddress, string name);
        Task<bool> UpdateNameByIdAsync(int memberId, string name);
        Task<bool> UpdateEmailAsync(string ethereumAddress, string email);
        Task<bool> UpdateEmailByIdAsync(int memberId, string email);
        Task<bool> UpdateBioAsync(string ethereumAddress, string bio);
        Task<bool> UpdateBioByIdAsync(int memberId, string bio);
        Task<bool> DeleteNameAsync(string ethereumAddress);
        Task<bool> DeleteNameByIdAsync(int memberId);
        Task<bool> DeleteEmailAsync(string ethereumAddress);
        Task<bool> DeleteEmailByIdAsync(int memberId);
        Task<bool> DeleteBioAsync(string ethereumAddress);
        Task<bool> DeleteBioByIdAsync(int memberId);
    }
}
