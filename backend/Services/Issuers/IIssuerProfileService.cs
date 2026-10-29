using backend.DTOs;

namespace backend.Services.Issuers
{
    public interface IIssuerProfileService
    {
        Task UpsertFromApplicationAsync(int memberId, string institutionName, string? description);
        Task<IssuerProfileDto?> GetMyProfileAsync(int memberId);
        Task<(IssuerProfileDto? Profile, int StatusCode, string? Error)> UpdateMyProfileAsync(
            int memberId,
            UpdateIssuerProfileDto dto);
        Task<IReadOnlyDictionary<int, string?>> ResolveDisplayNamesAsync(IEnumerable<int> memberIds);
        Task<string?> ResolveDisplayNameAsync(int? memberId);
    }
}
