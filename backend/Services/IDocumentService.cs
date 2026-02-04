using Microsoft.AspNetCore.Http;
using backend.DTOs;

namespace backend.Services
{
    public interface IDocumentService
    {
            Task<UploadResultDto> ProcessDocumentAsync(IFormFile file);

    }
}