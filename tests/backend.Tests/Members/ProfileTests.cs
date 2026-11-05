using System.Net;
using System.Net.Http.Headers;
using backend.Tests.Infrastructure;
using backend.Tests.Infrastructure.Fakes;

namespace backend.Tests.Members;

public sealed class ProfileTests : IClassFixture<DiviApiFactory>
{
    private readonly DiviApiFactory _factory;

    public ProfileTests(DiviApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Name_and_bio_updates_are_returned_by_profile()
    {
        var session = await _factory.LoginWithWalletAsync();

        var name = await session.Client.PatchAsJsonAsync("/api/GetProfile/name", new { firstName = "Ada", lastName = "Lovelace" });
        Assert.True(name.IsSuccessStatusCode, $"name update: {(int)name.StatusCode}");

        var bio = await session.Client.PatchAsJsonAsync("/api/GetProfile/bio", new { bio = "First programmer" });
        Assert.True(bio.IsSuccessStatusCode, $"bio update: {(int)bio.StatusCode}");

        var profile = await session.Client.GetAsync("/api/GetProfile");
        await profile.AssertStatusAsync(HttpStatusCode.OK);
        var body = await profile.ReadJsonAsync();
        Assert.Equal("Ada", body.GetString("firstName"));
        Assert.Equal("Lovelace", body.GetString("lastName"));
        Assert.Equal("Ada Lovelace", body.GetString("name"));
        Assert.Equal("First programmer", body.GetString("bio"));
        Assert.Equal(session.Address.ToLowerInvariant(), body.GetString("ethereumAddress"));
        Assert.Equal("user", body.GetString("role"));
    }

    [Fact]
    public async Task Public_profile_is_anonymous_and_hides_email()
    {
        var session = await _factory.LoginWithWalletAsync();
        var email = $"public-{Guid.NewGuid():N}@divi.test";
        var update = await session.Client.PatchAsJsonAsync("/api/GetProfile/email", new { email });
        Assert.True(update.IsSuccessStatusCode, $"email update: {(int)update.StatusCode}");

        var response = await _factory.CreateClient().GetAsync($"/api/profiles/{session.Address}");
        await response.AssertStatusAsync(HttpStatusCode.OK);
        var body = await response.ReadJsonAsync();
        Assert.Equal(session.Address.ToLowerInvariant(), body.GetString("ethereumAddress"));
        Assert.False(body.HasProperty("email"));
    }

    [Fact]
    public async Task Public_profile_for_unknown_address_returns_not_found()
    {
        var response = await _factory.CreateClient().GetAsync("/api/profiles/0x000000000000000000000000000000000000dead");
        await response.AssertStatusAsync(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Search_finds_members_by_name_and_ignores_short_queries()
    {
        var unique = $"Zed{Guid.NewGuid():N}"[..12];
        var session = await _factory.LoginWithWalletAsync();
        await session.Client.PatchAsJsonAsync("/api/GetProfile/name", new { firstName = unique, lastName = "Searchable" });

        var hit = await session.Client.GetAsync($"/api/profiles/search?q={unique.ToLowerInvariant()}");
        await hit.AssertStatusAsync(HttpStatusCode.OK);
        var results = (await hit.ReadJsonAsync()).EnumerateArray().ToList();
        Assert.Contains(results, r => r.GetString("ethereumAddress") == session.Address.ToLowerInvariant());

        var tooShort = await session.Client.GetAsync("/api/profiles/search?q=z");
        await tooShort.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Equal(0, (await tooShort.ReadJsonAsync()).GetArrayLength());
    }

    [Fact]
    public async Task Directory_lists_members()
    {
        var session = await _factory.LoginWithWalletAsync();

        var response = await session.Client.GetAsync("/api/profiles");
        await response.AssertStatusAsync(HttpStatusCode.OK);
        var results = (await response.ReadJsonAsync()).EnumerateArray().ToList();
        Assert.Contains(results, r => r.GetString("ethereumAddress") == session.Address.ToLowerInvariant());
    }

    [Fact]
    public async Task Avatar_upload_stores_object_and_sets_avatar_url()
    {
        var session = await _factory.LoginWithWalletAsync();

        var form = new MultipartFormDataContent();
        var image = new ByteArrayContent([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x01]);
        image.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(image, "file", "avatar.png");

        var upload = await session.Client.PostAsync("/api/GetProfile/avatar", form);
        await upload.AssertStatusAsync(HttpStatusCode.OK);
        var avatarUrl = (await upload.ReadJsonAsync()).GetString("avatarUrl");
        Assert.StartsWith(InMemoryObjectStorage.PublicBaseUrl, avatarUrl);

        var profile = await (await session.Client.GetAsync("/api/GetProfile")).ReadJsonAsync();
        Assert.Equal(avatarUrl, profile.GetString("avatarUrl"));

        var delete = await session.Client.DeleteAsync("/api/GetProfile/avatar");
        await delete.AssertStatusAsync(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Avatar_upload_rejects_unsupported_content_type()
    {
        var session = await _factory.LoginWithWalletAsync();

        var form = new MultipartFormDataContent();
        var text = new ByteArrayContent("not an image"u8.ToArray());
        text.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
        form.Add(text, "file", "avatar.txt");

        var upload = await session.Client.PostAsync("/api/GetProfile/avatar", form);
        await upload.AssertStatusAsync(HttpStatusCode.BadRequest);
    }
}
