using backend.Modules.Documents.Contracts;
namespace backend.Modules.Documents.Application
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

        /// <summary>
        /// Public timeline for a member: Issued/Revoked only for documents with visibility=public.
        /// CID is omitted (no anonymous PDF preview).
        /// </summary>
        Task<IReadOnlyList<DocumentActivityItemDto>> GetPublicActivityByAddressAsync(string ethereumAddress);
    }
}
