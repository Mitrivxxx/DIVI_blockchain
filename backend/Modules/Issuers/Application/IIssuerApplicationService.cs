using backend.Modules.Issuers.Contracts;
using backend.Modules.Issuers.Domain;
namespace backend.Modules.Issuers.Application
{
	public interface IIssuerApplicationService
	{
		Task<IssuerApplication> CreateIssuerAsync(CreateIssuerApplicationDto dto);
		Task<IEnumerable<IssuerApplicationListDto>> GetOnlyPendingIssuerAsync();
		Task<(bool Ok, string? Error)> UpdateStatusIssuerAsync(int id, string status);
	}
}
