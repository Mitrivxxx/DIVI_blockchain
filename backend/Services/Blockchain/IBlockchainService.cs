namespace backend.Services.Blockchain
{
	public interface IBlockchainService
	{
		Task PrecheckIssueDocumentAsync(string hash, string owner, byte documentType);
		// Returns tx hash after the transaction is mined successfully on-chain.
		Task<string> IssueDocumentAsync(string hash, string cid, string owner, byte documentType);
		Task<bool> VerifyDocumentAsync(string hash);
		Task<List<object>> GetDocumentAsync(string hash);
		Task<string> AddIssuerAsync(string issuerAddress);
		Task<string> ApproveIssuerAsync(string applicantAddress);
		Task<string> RemoveIssuerAsync(string issuerAddress);
		Task<bool> IsIssuerAsync(string address);
	}
}
