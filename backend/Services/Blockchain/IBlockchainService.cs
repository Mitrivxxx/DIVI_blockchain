using backend.DTOs;

namespace backend.Services.Blockchain
{
	public interface IBlockchainService
	{
		Task PrecheckIssueDocumentAsync(string hash, string owner, byte documentType);
		/// <summary>Issues on-chain and returns mined tx metadata (hash, block, issuer address).</summary>
		Task<IssueTransactionResultDto> IssueDocumentAsync(string hash, string cid, string owner, byte documentType);
		string GetBackendAccountAddress();
		/// <summary>True if document exists and status is Confirmed (not revoked).</summary>
		Task<bool> VerifyDocumentAsync(string hash);
		/// <summary>True if a document record exists on-chain (including revoked).</summary>
		Task<bool> DocumentExistsAsync(string hash);
		/// <summary>On-chain DocumentStatus: 0=Pending, 1=Confirmed, 2=Revoked. Null if not found.</summary>
		Task<byte?> GetDocumentStatusAsync(string hash);
		Task<List<object>> GetDocumentAsync(string hash);
		Task<string> RevokeDocumentAsync(string hash);
		Task<BlockchainTransactionInfoDto?> GetDocumentBlockchainInfoAsync(string hash);
		Task<string> GetNetworkNameAsync();
		Task<List<OwnerDocumentInfoDto>> GetDocumentsByOwnerAsync(string ownerAddress);
		Task<string> AddIssuerAsync(string issuerAddress);
		Task<string> RemoveIssuerAsync(string issuerAddress);
		Task<string> AddAdminAsync(string adminAddress);
		Task<string> RemoveAdminAsync(string adminAddress);
		Task<bool> IsIssuerAsync(string address);
		Task<bool> IsAdminAsync(string address);
	}
}
