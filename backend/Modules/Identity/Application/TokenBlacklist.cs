using backend.Infrastructure.Persistence;
using backend.Modules.Identity.Contracts;
using Microsoft.EntityFrameworkCore;

namespace backend.Modules.Identity.Application;

public sealed class TokenBlacklist : ITokenBlacklist
{
    private readonly AppDbContext _db;

    public TokenBlacklist(AppDbContext db)
    {
        _db = db;
    }

    public Task<bool> IsRevokedAsync(string jti) => _db.BlacklistedTokens.AnyAsync(b => b.Jti == jti);
}
