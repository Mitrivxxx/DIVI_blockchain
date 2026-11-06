using System.Net;
using System.Net.Http.Json;
using backend.Tests.Infrastructure;

namespace backend.Tests.Members;

public sealed class FollowTests : IClassFixture<DiviApiFactory>
{
    private readonly DiviApiFactory _factory;

    public FollowTests(DiviApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Follow_unfollow_and_list_following()
    {
        var viewer = await _factory.LoginWithWalletAsync();
        var target = await _factory.LoginWithWalletAsync();
        await target.Client.PatchAsJsonAsync("/api/GetProfile/name", new { firstName = "Target", lastName = "User" });

        var anonymous = _factory.CreateClient();
        var empty = await anonymous.GetAsync($"/api/profiles/{target.Address}/following");
        await empty.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Equal(0, (await empty.ReadJsonAsync()).GetArrayLength());

        var follow = await viewer.Client.PostAsync($"/api/profiles/{target.Address}/follow", content: null);
        await follow.AssertStatusAsync(HttpStatusCode.OK);

        var status = await (await viewer.Client.GetAsync($"/api/profiles/{target.Address}/follow-status")).ReadJsonAsync();
        Assert.True(status.GetProperty("isFollowing").GetBoolean());

        var following = await (await anonymous.GetAsync($"/api/profiles/{viewer.Address}/following")).ReadJsonAsync();
        Assert.Contains(
            following.EnumerateArray(),
            item => item.GetProperty("memberId").GetInt32() == target.MemberId
                    && item.GetString("name") == "Target User");

        var unfollow = await viewer.Client.DeleteAsync($"/api/profiles/{target.Address}/follow");
        await unfollow.AssertStatusAsync(HttpStatusCode.OK);

        var statusAfter = await (await viewer.Client.GetAsync($"/api/profiles/{target.Address}/follow-status")).ReadJsonAsync();
        Assert.False(statusAfter.GetProperty("isFollowing").GetBoolean());
        Assert.Equal(0, (await (await anonymous.GetAsync($"/api/profiles/{viewer.Address}/following")).ReadJsonAsync()).GetArrayLength());
    }

    [Fact]
    public async Task Cannot_follow_self()
    {
        var session = await _factory.LoginWithWalletAsync();
        var response = await session.Client.PostAsync($"/api/profiles/{session.Address}/follow", content: null);
        await response.AssertStatusAsync(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Follow_requires_auth()
    {
        var target = await _factory.LoginWithWalletAsync();
        var response = await _factory.CreateClient().PostAsync($"/api/profiles/{target.Address}/follow", content: null);
        await response.AssertStatusAsync(HttpStatusCode.Unauthorized);
    }
}
