using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.BuildingBlocks;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Member id from the JWT <c>sub</c> claim; null when missing, not numeric, or not positive.</summary>
    public static int? GetMemberId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("nameid")
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(raw, out var id) && id > 0 ? id : null;
    }
}
