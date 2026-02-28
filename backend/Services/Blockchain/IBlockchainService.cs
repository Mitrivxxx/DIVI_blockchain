namespace backend.Services.Blockchain
{
	public interface IBlockchainService
	{
		Task<string> IssueDocumentAsync(string hash, string cid, string owner, string documentType);
		Task<bool> VerifyDocumentAsync(string hash);
		Task<List<object>> GetDocumentAsync(string hash);
		Task<string> AddIssuerAsync(string issuerAddress);
		Task<string> ApproveIssuerAsync(string applicantAddress);
		Task<string> RemoveIssuerAsync(string issuerAddress);
		Task<bool> IsIssuerAsync(string address);
	}
}
