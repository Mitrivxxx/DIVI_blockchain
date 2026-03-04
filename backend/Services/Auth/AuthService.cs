using System.Threading.Tasks;
using backend.Services.Auth;
using backend.Data;

namespace backend.Services.Auth
{
	public class AuthService : IAuthService
	{
		public string GenerateNonce(string address)
		{
			var nonceValue = Guid.NewGuid().ToString();
			return nonceValue;
		}
		public async Task ConsumeNonce(string address)
		{
			await Task.CompletedTask;
		}

		public async Task DeactivateExpiredNonces(AppDbContext context)
		{
			var now = DateTime.UtcNow;
			var expiredNonces = context.Nonces.Where(n => n.IsUsed && n.ExpiresAt < now.AddMinutes(-10)).ToList();
			foreach (var nonce in expiredNonces)
			{
				nonce.IsUsed = false;
			}
			if (expiredNonces.Count > 0)
				await context.SaveChangesAsync();
		}
	}
}
