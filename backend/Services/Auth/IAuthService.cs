using System.Threading.Tasks;

namespace backend.Services.Auth
{
	public interface IAuthService
	{
		Task ConsumeNonce(string address);
		string GenerateNonce(string address);
		Task DeactivateExpiredNonces(Data.AppDbContext context);
	}
}
