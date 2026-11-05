namespace backend.Modules.Identity.Contracts;

/// <summary>Access tokens revoked by logout (JTI blacklist).</summary>
public interface ITokenBlacklist
{
    Task<bool> IsRevokedAsync(string jti);
}
