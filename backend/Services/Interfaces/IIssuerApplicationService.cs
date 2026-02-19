using backend.DTOs;
using backend.Models;

namespace backend.Services.Interfaces
{
    public interface IIssuerApplicationService
    {
        Task<IssuerApplication> CreateIssuerAsync(CreateIssuerApplicationDto dto);
        Task<IEnumerable<IssuerApplicationListDto>> GetOnlyPendingIssuerAsync();
        Task<bool> UpdateStatusIssuerAsync(Guid id, string status);
    }
}
