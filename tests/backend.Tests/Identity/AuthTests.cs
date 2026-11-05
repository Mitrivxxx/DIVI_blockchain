using System.Net;
using System.Net.Http.Json;
using backend.Tests.Infrastructure;
using Nethereum.Signer;

namespace backend.Tests.Identity;

public sealed class AuthTests : IClassFixture<DiviApiFactory>
{
    private readonly DiviApiFactory _factory;

    public AuthTests(DiviApiFactory factory) => _factory = factory;

    private static string NewEmail() => $"user-{Guid.NewGuid():N}@divi.test";

    [Fact]
    public async Task Register_then_login_sets_auth_cookies_that_authorize_profile()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();

        var register = await client.PostAsJsonAsync("/Auth/register", new { email, password = "Secret123!" });
        await register.AssertStatusAsync(HttpStatusCode.Created);
        var registered = await register.ReadJsonAsync();
        Assert.Equal(email, registered.GetString("email"));
        Assert.Equal(Roles.UserId, registered.GetProperty("memberRoleId").GetInt32());

        var login = await client.PostAsJsonAsync("/Auth/login", new { email, password = "Secret123!" });
        await login.AssertStatusAsync(HttpStatusCode.OK);
        var cookies = login.SetCookieNames().ToList();
        Assert.Contains("access_token", cookies);
        Assert.Contains("refresh_token", cookies);

        var profile = await client.GetAsync("/api/GetProfile");
        await profile.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Equal(email, (await profile.ReadJsonAsync()).GetString("email"));
    }

    [Fact]
    public async Task Register_with_taken_email_returns_conflict_case_insensitively()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();

        var first = await client.PostAsJsonAsync("/Auth/register", new { email, password = "Secret123!" });
        await first.AssertStatusAsync(HttpStatusCode.Created);

        var second = await client.PostAsJsonAsync("/Auth/register", new { email = email.ToUpperInvariant(), password = "Other123!" });
        await second.AssertStatusAsync(HttpStatusCode.Conflict);
    }

    [Theory]
    [InlineData("", "Secret123!")]
    [InlineData("someone@divi.test", "")]
    public async Task Register_with_missing_fields_returns_bad_request(string email, string password)
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/Auth/register", new { email, password });
        await response.AssertStatusAsync(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_unauthorized()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/Auth/register", new { email, password = "Secret123!" });

        var login = await client.PostAsJsonAsync("/Auth/login", new { email, password = "Wrong123!" });
        await login.AssertStatusAsync(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_with_cookie_returns_new_access_token()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/Auth/register", new { email, password = "Secret123!" });
        await client.PostAsJsonAsync("/Auth/login", new { email, password = "Secret123!" });

        var refresh = await client.PostAsync("/Auth/refresh", content: null);
        await refresh.AssertStatusAsync(HttpStatusCode.OK);
        var token = (await refresh.ReadJsonAsync()).GetString("token");
        Assert.Equal("user", TestAuth.ReadRole(token));
    }

    [Fact]
    public async Task Refresh_without_cookie_returns_unauthorized()
    {
        var refresh = await _factory.CreateClient().PostAsync("/Auth/refresh", content: null);
        await refresh.AssertStatusAsync(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_blacklists_the_access_token()
    {
        var session = await _factory.LoginWithWalletAsync();

        var before = await session.Client.GetAsync("/api/user-role");
        await before.AssertStatusAsync(HttpStatusCode.OK);

        var logout = await session.Client.PostAsync("/Auth/logout", content: null);
        await logout.AssertStatusAsync(HttpStatusCode.OK);

        var after = await _factory.CreateClient().WithBearer(session.Token).GetAsync("/api/user-role");
        await after.AssertStatusAsync(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Web3_sign_in_creates_user_member_once_per_wallet()
    {
        var key = EthECKey.GenerateKey();

        var first = await _factory.LoginWithWalletAsync(key);
        Assert.Equal("user", TestAuth.ReadRole(first.Token));

        var role = await first.Client.GetAsync("/api/user-role");
        await role.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Equal("user", (await role.ReadJsonAsync()).GetString("role"));

        var second = await _factory.LoginWithWalletAsync(key);
        Assert.Equal(first.MemberId, second.MemberId);
    }

    [Fact]
    public async Task Web3_verify_with_foreign_signature_returns_unauthorized()
    {
        var client = _factory.CreateClient();
        var address = EthECKey.GenerateKey().GetPublicAddress();

        var nonceResponse = await client.PostAsJsonAsync("/Auth/nonce", new { address });
        var nonce = (await nonceResponse.ReadJsonAsync()).GetString("nonce");
        var signature = new EthereumMessageSigner().EncodeUTF8AndSign(nonce, EthECKey.GenerateKey());

        var verify = await client.PostAsJsonAsync("/Auth/verify", new { address, nonce, signature });
        await verify.AssertStatusAsync(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Nonce_without_address_returns_bad_request()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/Auth/nonce", new { address = "" });
        await response.AssertStatusAsync(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("/api/GetProfile")]
    [InlineData("/api/user-role")]
    [InlineData("/api/profiles")]
    [InlineData("/api/profiles/me/credentials")]
    [InlineData("/api/profiles/me/activity")]
    [InlineData("/api/documents/issued-by-me")]
    [InlineData("/api/issuer/profile")]
    public async Task Protected_endpoints_reject_anonymous_requests(string url)
    {
        var response = await _factory.CreateClient().GetAsync(url);
        await response.AssertStatusAsync(HttpStatusCode.Unauthorized);
    }
}
