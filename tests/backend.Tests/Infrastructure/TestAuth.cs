using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Nethereum.Signer;

namespace backend.Tests.Infrastructure;

public sealed record WalletSession(EthECKey Key, string Address, string Token, int MemberId, HttpClient Client);

public static class TestAuth
{
    /// <summary>Signs an access token with the same shape as JwtService (sub, role, type, jti).</summary>
    public static string CreateAccessToken(int memberId, string role)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, memberId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim("type", "access"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestEnvironment.JwtKey));
        var token = new JwtSecurityToken(
            issuer: TestEnvironment.JwtIssuer,
            audience: TestEnvironment.JwtAudience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static HttpClient CreateClientAs(this DiviApiFactory factory, int memberId, int roleId) =>
        factory.CreateClient().WithBearer(CreateAccessToken(memberId, Roles.NameOf(roleId)));

    public static int ReadMemberId(string token) =>
        int.Parse(new JwtSecurityTokenHandler().ReadJwtToken(token).Subject);

    public static string ReadRole(string token) =>
        new JwtSecurityTokenHandler().ReadJwtToken(token).Claims
            .First(c => c.Type is ClaimTypes.Role or "role").Value;

    /// <summary>Full Web3 sign-in: /Auth/nonce → personal_sign → /Auth/verify.</summary>
    public static async Task<WalletSession> LoginWithWalletAsync(this DiviApiFactory factory, EthECKey? key = null)
    {
        key ??= EthECKey.GenerateKey();
        var address = key.GetPublicAddress();
        var client = factory.CreateClient();

        var nonceResponse = await client.PostAsJsonAsync("/Auth/nonce", new { address });
        await nonceResponse.AssertStatusAsync(System.Net.HttpStatusCode.OK);
        var nonce = (await nonceResponse.ReadJsonAsync()).GetString("nonce");

        var signature = new EthereumMessageSigner().EncodeUTF8AndSign(nonce, key);
        var verifyResponse = await client.PostAsJsonAsync("/Auth/verify", new { address, nonce, signature });
        await verifyResponse.AssertStatusAsync(System.Net.HttpStatusCode.OK);
        var token = (await verifyResponse.ReadJsonAsync()).GetString("token");

        client.WithBearer(token);
        return new WalletSession(key, address, token, ReadMemberId(token), client);
    }

    public static async Task<int> CreateMemberAsync(
        this DiviApiFactory factory,
        int roleId,
        string? ethereumAddress = null,
        string? firstName = null)
    {
        return await factory.WithDbAsync(async db =>
        {
            var member = new Member
            {
                MemberRoleId = roleId,
                EthereumAddress = ethereumAddress?.ToLowerInvariant(),
                FirstName = firstName,
                CreatedAt = DateTime.UtcNow,
            };
            db.Members.Add(member);
            await db.SaveChangesAsync();
            return member.Id;
        });
    }

    public static Task<int> GetSeededOwnerIdAsync(this DiviApiFactory factory) =>
        factory.WithDbAsync(db => db.Members.Where(m => m.MemberRoleId == Roles.OwnerId).Select(m => m.Id).FirstAsync());

    public static Task<int> GetMemberRoleIdAsync(this DiviApiFactory factory, int memberId) =>
        factory.WithDbAsync(db => db.Members.Where(m => m.Id == memberId).Select(m => m.MemberRoleId).FirstAsync());
}
