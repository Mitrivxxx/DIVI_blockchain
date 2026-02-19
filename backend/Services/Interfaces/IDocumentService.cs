using backend.DTOs;

namespace backend.Services
{
    public interface IDocumentService
    {
        Task<UploadResultDto> ProcessDocumentAsync(IFormFile file, string documentType, string owner);
    }
}