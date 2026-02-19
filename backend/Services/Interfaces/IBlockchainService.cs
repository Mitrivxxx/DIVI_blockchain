
public interface IBlockchainService
{
    // DOCUMENTS
    Task<string> IssueDocumentAsync(string hash, string cid, string owner, string documentType);
    Task<bool> VerifyDocumentAsync(string hash);
    Task<List<object>> GetDocumentAsync(string hash);

    // ISSUERS
    Task<string> AddIssuerAsync(string issuerAddress);
    Task<string> ApproveIssuerAsync(string applicantAddress);
    Task<string> RemoveIssuerAsync(string issuerAddress);
    Task<bool> IsIssuerAsync(string address);
}