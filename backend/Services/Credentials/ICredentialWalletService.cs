using backend.DTOs;

namespace backend.Services.Credentials
{
    public interface ICredentialWalletService
    {
        Task<CredentialWalletDto> GetMyCredentialsAsync(int memberId);
        Task<(CredentialItemDto? Item, int StatusCode, string? Error)> UpdateVisibilityAsync(
            int memberId,
            string hash,
            string visibility);
        Task<PublicCredentialDto?> GetByShareTokenAsync(string token);
        Task<PublicCredentialWalletDto> GetPublicCredentialsByAddressAsync(string ethereumAddress);
    }
}
