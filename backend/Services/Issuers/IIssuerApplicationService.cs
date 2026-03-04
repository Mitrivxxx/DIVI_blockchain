using backend.DTOs;
using backend.Models;

namespace backend.Services.Issuers
{
	public interface IIssuerApplicationService
	{
		Task<IssuerApplication> CreateIssuerAsync(CreateIssuerApplicationDto dto);
		Task<IEnumerable<IssuerApplicationListDto>> GetOnlyPendingIssuerAsync();
		Task<bool> UpdateStatusIssuerAsync(int id, string status);
	}
}
