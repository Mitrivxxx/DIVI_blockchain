using backend.DTOs;

namespace backend.Services.Activity
{
    public interface IDocumentActivityService
    {
        Task LogAsync(
            string documentHash,
            byte activityType,
            string? txHash,
            long? blockNumber,
            int? memberId,
            DateTimeOffset? timestamp = null);

        Task<IReadOnlyList<DocumentActivityItemDto>> GetMyActivityAsync(int memberId);
    }
}
