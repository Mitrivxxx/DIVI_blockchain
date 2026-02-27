using System.Threading.Tasks;
using backend.Services.Interfaces;
using backend.Data;

namespace backend.Services
{
    public class AuthService : IAuthService
    {
        public string GenerateNonce(string address)
        {
            // Generuje losowy nonce (np. GUID)
            var nonceValue = Guid.NewGuid().ToString();
            // Tu można dodać zapis do bazy lub inne operacje
            return nonceValue;
        }
        public async Task ConsumeNonce(string address)
        {
            // TODO: Implement nonce consumption logic (e.g., remove from DB)
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
