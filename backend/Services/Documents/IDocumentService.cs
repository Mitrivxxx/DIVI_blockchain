using backend.DTOs;

namespace backend.Services.Documents
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
		/// <summary>Authorized PDF bytes for owner / issuing member / admin / owner role.</summary>
		Task<(byte[]? Bytes, int StatusCode, string? Error)> GetFileContentAsync(string hash, int? memberId, string role);
	}
}
