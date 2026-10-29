using backend.DTOs;

namespace backend.Services.GetProfile
{
    public interface IGetProfileService
    {
        Task<MemberProfileDto?> GetProfileByAddressAsync(string ethereumAddress);
        Task<MemberProfileDto?> GetProfileByIdAsync(int memberId);
        Task<IReadOnlyList<MemberSearchResultDto>> SearchMembersAsync(string query, int limit = 10);
        Task<IReadOnlyList<MemberSearchResultDto>> ListMembersAsync(int limit = 200);
        Task<bool> UpdateNameAsync(string ethereumAddress, string firstName, string? lastName);
        Task<bool> UpdateNameByIdAsync(int memberId, string firstName, string? lastName);
        Task<(string? AvatarUrl, int StatusCode, string? Error)> UploadAvatarByIdAsync(int memberId, IFormFile file);
        /// <summary>Returns public MinIO URL for redirect, or 404 when missing.</summary>
        Task<(bool Ok, string? PublicUrl, int StatusCode)> ResolveAvatarPublicUrlAsync(int memberId);
        Task<(bool Ok, int StatusCode, string? Error)> DeleteAvatarByIdAsync(int memberId);
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
