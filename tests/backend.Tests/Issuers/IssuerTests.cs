using System.Net;
using System.Net.Http.Json;
using backend.Tests.Infrastructure;
using Nethereum.Signer;

namespace backend.Tests.Issuers;

public sealed class IssuerTests : IClassFixture<DiviApiFactory>
{
    private readonly DiviApiFactory _factory;

    public IssuerTests(DiviApiFactory factory) => _factory = factory;

    private async Task<HttpClient> OwnerClientAsync() =>
        _factory.CreateClientAs(await _factory.GetSeededOwnerIdAsync(), Roles.OwnerId);

    private static object ApplicationFor(string address, string institution) => new
    {
        institutionName = institution,
        ethereumAddress = address,
        email = $"issuer-{Guid.NewGuid():N}@divi.test",
        description = "Test university",
    };

    private static async Task<int> ApplyAsync(HttpClient client, string address, string institution)
    {
        var response = await client.PostAsJsonAsync("/api/issuer", ApplicationFor(address, institution));
        await response.AssertStatusAsync(HttpStatusCode.Created);
        return (await response.ReadJsonAsync()).GetProperty("id").GetInt32();
    }

    [Fact]
    public async Task Approved_application_promotes_member_to_issuer_on_chain_and_in_db()
    {
        var applicant = await _factory.LoginWithWalletAsync();
        var institution = $"Uni {Guid.NewGuid():N}"[..20];
        var applicationId = await ApplyAsync(applicant.Client, applicant.Address, institution);

        var owner = await OwnerClientAsync();
        var pending = await owner.GetAsync("/api/issuer");
        await pending.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Contains(
            (await pending.ReadJsonAsync()).EnumerateArray(),
            a => a.GetProperty("id").GetInt32() == applicationId);

        var approve = await owner.PatchAsync($"/api/issuer/{applicationId}/status?status=Approved", content: null);
        await approve.AssertStatusAsync(HttpStatusCode.NoContent);

        Assert.True(await _factory.Blockchain.IsIssuerAsync(applicant.Address));
        Assert.Equal(Roles.IssuerId, await _factory.GetMemberRoleIdAsync(applicant.MemberId));

        var relogin = await _factory.LoginWithWalletAsync(applicant.Key);
        Assert.Equal(applicant.MemberId, relogin.MemberId);
        Assert.Equal("issuer", TestAuth.ReadRole(relogin.Token));

        var issuerClient = relogin.Client;
        var profile = await issuerClient.GetAsync("/api/issuer/profile");
        await profile.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Equal(institution, (await profile.ReadJsonAsync()).GetString("institutionName"));

        var pendingAfter = await (await owner.GetAsync("/api/issuer")).ReadJsonAsync();
        Assert.DoesNotContain(pendingAfter.EnumerateArray(), a => a.GetProperty("id").GetInt32() == applicationId);
    }

    [Fact]
    public async Task Refresh_after_approval_reloads_issuer_role_from_db()
    {
        var applicant = await _factory.LoginWithWalletAsync();
        var applicationId = await ApplyAsync(applicant.Client, applicant.Address, "Refresh Uni");
        await (await OwnerClientAsync()).PatchAsync($"/api/issuer/{applicationId}/status?status=Approved", content: null);

        var refresh = await applicant.Client.PostAsync("/Auth/refresh", content: null);
        await refresh.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Equal("issuer", TestAuth.ReadRole((await refresh.ReadJsonAsync()).GetString("token")));
    }

    [Fact]
    public async Task Issuer_can_update_institution_profile()
    {
        var applicant = await _factory.LoginWithWalletAsync();
        var applicationId = await ApplyAsync(applicant.Client, applicant.Address, "Old Name");
        var owner = await OwnerClientAsync();
        await owner.PatchAsync($"/api/issuer/{applicationId}/status?status=Approved", content: null);

        var issuer = _factory.CreateClientAs(applicant.MemberId, Roles.IssuerId);
        var update = await issuer.PatchAsJsonAsync("/api/issuer/profile", new { institutionName = "New Name", country = "PL" });
        await update.AssertStatusAsync(HttpStatusCode.OK);

        var body = await (await issuer.GetAsync("/api/issuer/profile")).ReadJsonAsync();
        Assert.Equal("New Name", body.GetString("institutionName"));
        Assert.Equal("PL", body.GetString("country"));
    }

    [Fact]
    public async Task Rejected_application_keeps_user_role()
    {
        var applicant = await _factory.LoginWithWalletAsync();
        var applicationId = await ApplyAsync(applicant.Client, applicant.Address, "Rejected Uni");

        var reject = await (await OwnerClientAsync()).PatchAsync($"/api/issuer/{applicationId}/status?status=Rejected", content: null);
        await reject.AssertStatusAsync(HttpStatusCode.NoContent);

        Assert.Equal(Roles.UserId, await _factory.GetMemberRoleIdAsync(applicant.MemberId));
        Assert.False(await _factory.Blockchain.IsIssuerAsync(applicant.Address));
    }

    [Fact]
    public async Task Approving_application_without_member_for_wallet_fails()
    {
        var applicant = await _factory.LoginWithWalletAsync();
        var strangerAddress = EthECKey.GenerateKey().GetPublicAddress();
        var applicationId = await ApplyAsync(applicant.Client, strangerAddress, "Ghost Uni");

        var approve = await (await OwnerClientAsync()).PatchAsync($"/api/issuer/{applicationId}/status?status=Approved", content: null);
        await approve.AssertStatusAsync(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("bogus")]
    public async Task Invalid_status_is_rejected(string status)
    {
        var applicant = await _factory.LoginWithWalletAsync();
        var applicationId = await ApplyAsync(applicant.Client, applicant.Address, "Status Uni");

        var response = await (await OwnerClientAsync()).PatchAsync($"/api/issuer/{applicationId}/status?status={status}", content: null);
        await response.AssertStatusAsync(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Regular_user_cannot_review_applications()
    {
        var user = await _factory.LoginWithWalletAsync();

        var list = await user.Client.GetAsync("/api/issuer");
        await list.AssertStatusAsync(HttpStatusCode.Forbidden);

        var anonymous = await _factory.CreateClient().GetAsync("/api/issuer");
        await anonymous.AssertStatusAsync(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Owner_can_grant_and_revoke_admin()
    {
        var candidate = await _factory.LoginWithWalletAsync();
        var owner = await OwnerClientAsync();

        var add = await owner.PostAsJsonAsync("/api/admins", new { ethereumAddress = candidate.Address });
        await add.AssertStatusAsync(HttpStatusCode.NoContent);
        Assert.Equal(Roles.AdminId, await _factory.GetMemberRoleIdAsync(candidate.MemberId));
        Assert.True(await _factory.Blockchain.IsAdminAsync(candidate.Address));

        var remove = await owner.DeleteAsync($"/api/admins/{candidate.Address}");
        await remove.AssertStatusAsync(HttpStatusCode.NoContent);
        Assert.Equal(Roles.UserId, await _factory.GetMemberRoleIdAsync(candidate.MemberId));
    }

    [Fact]
    public async Task Only_owner_can_manage_admins()
    {
        var adminId = await _factory.CreateMemberAsync(Roles.AdminId, EthECKey.GenerateKey().GetPublicAddress());
        var admin = _factory.CreateClientAs(adminId, Roles.AdminId);

        var response = await admin.PostAsJsonAsync("/api/admins", new { ethereumAddress = EthECKey.GenerateKey().GetPublicAddress() });
        await response.AssertStatusAsync(HttpStatusCode.Forbidden);
    }
}
