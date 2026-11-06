using backend.Modules.Documents.Contracts;
namespace backend.Modules.Documents.Application
{
	public interface IDocumentService
	{
		Task<UploadResultDto> ProcessUploadAsync(
			IFormFile? file,
			string documentType,
			string owner,
			string? periodFrom,
			string? periodTo,
			string? title = null,
			int? issuedByMemberId = null);
		Task<IReadOnlyList<DocumentListItemDto>> GetByOwnerAddressAsync(string ownerAddress);
		Task<IReadOnlyList<DocumentListItemDto>> GetByIssuerAddressAsync(string issuerAddress);
		Task<IReadOnlyList<DocumentListItemDto>> GetIssuedByMemberAsync(int memberId);
		Task<DocumentListItemDto?> GetByHashAsync(string hash);
		/// <summary>Returns (Ok, HttpStatusHint, Error). HttpStatusHint: 404/403/409/502.</summary>
		Task<(bool Ok, int StatusCode, string? Error)> RevokeAsync(string hash, int? memberId, string role);
		/// <summary>PDF bytes for owner / issuing member / admin|owner, or anyone when visibility=public.</summary>
		Task<(byte[]? Bytes, int StatusCode, string? Error)> GetFileContentAsync(string hash, int? memberId, string role);
	}
}
