using backend.Modules.Issuers.Contracts;
namespace backend.Modules.Issuers.Application
{
    public interface IIssuerProfileService
    {
        Task UpsertFromApplicationAsync(int memberId, string institutionName, string? description);
        Task<IssuerProfileDto?> GetMyProfileAsync(int memberId);
        Task<(IssuerProfileDto? Profile, int StatusCode, string? Error)> UpdateMyProfileAsync(
            int memberId,
            UpdateIssuerProfileDto dto);
    }
}
