namespace backend.Tests.Infrastructure;

/// <summary>Skip reasons for tests that document current backend bugs; remove the Skip once fixed.</summary>
public static class KnownIssues
{
    public const string RefreshTokenSubClaim =
        "Known bug: JwtService.ValidateRefreshToken reads 'sub', but JwtSecurityTokenHandler maps it to ClaimTypes.NameIdentifier, so /Auth/refresh always returns 401.";
}
