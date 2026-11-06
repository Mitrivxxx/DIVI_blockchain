using System.Net;
using backend.Tests.Infrastructure;
using Nethereum.Signer;

namespace backend.Tests.Documents;

public sealed class CredentialWalletTests : IClassFixture<DiviApiFactory>
{
    private readonly DiviApiFactory _factory;

    public CredentialWalletTests(DiviApiFactory factory) => _factory = factory;

    private async Task<(HttpClient Issuer, WalletSession Owner, string Hash)> IssueToNewOwnerAsync()
    {
        var issuerId = await _factory.CreateMemberAsync(Roles.IssuerId, EthECKey.GenerateKey().GetPublicAddress());
        var issuer = _factory.CreateClientAs(issuerId, Roles.IssuerId);
        var owner = await _factory.LoginWithWalletAsync();
        var hash = await TestDocuments.IssuePdfHashAsync(issuer, owner.Address);
        return (issuer, owner, hash);
    }

    private static Task<HttpResponseMessage> SetVisibilityAsync(HttpClient client, string hash, string visibility) =>
        client.PatchAsJsonAsync($"/api/profiles/me/credentials/{hash}/visibility", new { visibility });

    [Fact]
    public async Task Owner_wallet_has_all_five_sections_and_issued_credential_is_private()
    {
        var (_, owner, hash) = await IssueToNewOwnerAsync();

        var response = await owner.Client.GetAsync("/api/profiles/me/credentials");
        await response.AssertStatusAsync(HttpStatusCode.OK);
        var wallet = await response.ReadJsonAsync();

        var sections = wallet.GetProperty("sections").EnumerateArray().ToList();
        Assert.Equal(5, sections.Count);
        Assert.Equal([0, 1, 2, 3, 4], sections.Select(s => (int)s.GetProperty("documentType").GetByte()));

        var item = Assert.Single(TestDocuments.AllSectionItems(wallet));
        Assert.Equal(hash, item.GetString("hash"));
        Assert.Equal("private", item.GetString("visibility"));
    }

    [Fact]
    public async Task Unlisted_credential_is_reachable_by_share_token_until_made_private()
    {
        var (_, owner, hash) = await IssueToNewOwnerAsync();

        var unlisted = await SetVisibilityAsync(owner.Client, hash, "unlisted");
        await unlisted.AssertStatusAsync(HttpStatusCode.OK);
        var item = await unlisted.ReadJsonAsync();
        Assert.Equal("unlisted", item.GetString("visibility"));
        var token = item.GetString("shareToken");
        Assert.False(string.IsNullOrEmpty(token));

        var anonymous = _factory.CreateClient();
        var shared = await anonymous.GetAsync($"/api/share/{token}");
        await shared.AssertStatusAsync(HttpStatusCode.OK);
        var sharedBody = await shared.ReadJsonAsync();
        Assert.Equal(hash, sharedBody.GetString("hash"));
        Assert.False(sharedBody.HasProperty("cid"));

        var publicWallet = await (await anonymous.GetAsync($"/api/profiles/{owner.Address}/credentials")).ReadJsonAsync();
        Assert.Empty(TestDocuments.AllSectionItems(publicWallet));

        await (await SetVisibilityAsync(owner.Client, hash, "private")).AssertStatusAsync(HttpStatusCode.OK);
        await (await anonymous.GetAsync($"/api/share/{token}")).AssertStatusAsync(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Public_credential_appears_in_public_wallet_until_revoked()
    {
        var (issuer, owner, hash) = await IssueToNewOwnerAsync();
        await (await SetVisibilityAsync(owner.Client, hash, "public")).AssertStatusAsync(HttpStatusCode.OK);

        var anonymous = _factory.CreateClient();
        var response = await anonymous.GetAsync($"/api/profiles/{owner.Address}/credentials");
        await response.AssertStatusAsync(HttpStatusCode.OK);
        var item = Assert.Single(TestDocuments.AllSectionItems(await response.ReadJsonAsync()));
        Assert.Equal(hash, item.GetString("hash"));
        Assert.False(item.HasProperty("cid"));
        Assert.True(item.GetProperty("hasPdfFile").GetBoolean());

        await (await issuer.DeleteAsync($"/api/documents/{hash}/revoke")).AssertStatusAsync(HttpStatusCode.NoContent);

        var afterRevoke = await (await anonymous.GetAsync($"/api/profiles/{owner.Address}/credentials")).ReadJsonAsync();
        Assert.Empty(TestDocuments.AllSectionItems(afterRevoke));
    }

    [Fact]
    public async Task Only_owner_can_change_visibility_and_value_is_validated()
    {
        var (_, owner, hash) = await IssueToNewOwnerAsync();
        var stranger = await _factory.LoginWithWalletAsync();

        await (await SetVisibilityAsync(stranger.Client, hash, "public")).AssertStatusAsync(HttpStatusCode.Forbidden);
        await (await SetVisibilityAsync(owner.Client, hash, "everyone")).AssertStatusAsync(HttpStatusCode.BadRequest);
        await (await SetVisibilityAsync(owner.Client, "0xdeadbeef", "public")).AssertStatusAsync(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Activity_lists_issue_and_revoke_for_issuer_and_owner()
    {
        var (issuer, owner, hash) = await IssueToNewOwnerAsync();
        await (await issuer.DeleteAsync($"/api/documents/{hash}/revoke")).AssertStatusAsync(HttpStatusCode.NoContent);

        foreach (var client in new[] { issuer, owner.Client })
        {
            var response = await client.GetAsync("/api/profiles/me/activity");
            await response.AssertStatusAsync(HttpStatusCode.OK);
            var types = (await response.ReadJsonAsync()).EnumerateArray()
                .Where(a => a.GetString("hash") == hash)
                .Select(a => a.GetString("activityType"))
                .ToList();

            Assert.Contains("Issued", types);
            Assert.Contains("Revoked", types);
        }
    }

    [Fact]
    public async Task Public_activity_shows_only_public_documents_and_omits_cid()
    {
        var (_, owner, hash) = await IssueToNewOwnerAsync();
        var anonymous = _factory.CreateClient();

        var before = await anonymous.GetAsync($"/api/profiles/{owner.Address}/activity");
        await before.AssertStatusAsync(HttpStatusCode.OK);
        Assert.DoesNotContain(
            (await before.ReadJsonAsync()).EnumerateArray(),
            a => a.GetString("hash") == hash);

        await (await SetVisibilityAsync(owner.Client, hash, "public")).AssertStatusAsync(HttpStatusCode.OK);

        var after = await anonymous.GetAsync($"/api/profiles/{owner.Address}/activity");
        await after.AssertStatusAsync(HttpStatusCode.OK);
        var item = Assert.Single(
            (await after.ReadJsonAsync()).EnumerateArray(),
            a => a.GetString("hash") == hash);
        Assert.Equal("Issued", item.GetString("activityType"));
        if (item.TryGetProperty("cid", out var cidProp))
        {
            Assert.True(
                cidProp.ValueKind == System.Text.Json.JsonValueKind.Null
                || string.IsNullOrEmpty(cidProp.GetString()));
        }
    }

}
