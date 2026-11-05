using backend.Infrastructure.Persistence;

namespace backend.Modules.Identity.Application
{
	public interface IAuthService
	{
		Task ConsumeNonce(string address);
		string GenerateNonce(string address);
		Task DeactivateExpiredNonces(AppDbContext context);
	}
}
