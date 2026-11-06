using backend.Modules.Documents.Contracts;

namespace backend.Modules.Documents.Application
{
    public interface IDocumentVerification
    {
        Task<DocumentVerificationResultDto> VerifyDocumentAsync(IFormFile file);

        /// <summary>Ephemeral verify by known document hash (no file upload). Nothing is persisted.</summary>
        Task<DocumentVerificationResultDto> VerifyByHashAsync(string hash);
    }
}
