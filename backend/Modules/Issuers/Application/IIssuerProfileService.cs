using backend.Modules.Issuers.Contracts;
namespace backend.Modules.Issuers.Application
{
    public interface IIssuerProfileService
    {
        Task UpsertFromApplicationAsync(int memberId, string institutionName, string? description);
        Task<IssuerProfileDto?> GetMyProfileAsync(int memberId);
        Task<IssuerProfileDto?> GetByEthereumAddressAsync(string ethereumAddress);
        Task<InstitutionListItemDto?> GetInstitutionByMemberIdAsync(int memberId);
        Task<IReadOnlyList<InstitutionListItemDto>> ListInstitutionsAsync(string? query, int limit = 100);
        Task<(IssuerProfileDto? Profile, int StatusCode, string? Error)> UpdateMyProfileAsync(
            int memberId,
            UpdateIssuerProfileDto dto);
        /// <summary>Ephemeral: check authorizedIssuers for address. No DB writes.</summary>
        Task<IssuerOnChainVerifyDto> VerifyIssuerOnChainAsync(string ethereumAddress);
    }
}
