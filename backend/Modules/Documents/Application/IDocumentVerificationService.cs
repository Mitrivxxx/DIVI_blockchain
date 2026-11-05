using backend.Modules.Documents.Contracts;

namespace backend.Modules.Documents.Application
{
    public interface IDocumentVerification
    {
		Task<DocumentVerificationResultDto> VerifyDocumentAsync(IFormFile file);

    }
}