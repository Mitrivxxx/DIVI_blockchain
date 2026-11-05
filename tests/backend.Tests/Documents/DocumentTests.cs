using System.Net;
using backend.Tests.Infrastructure;
using backend.Tests.Infrastructure.Fakes;
using Nethereum.Signer;

namespace backend.Tests.Documents;

public sealed class DocumentTests : IClassFixture<DiviApiFactory>
{
    private readonly DiviApiFactory _factory;

    public DocumentTests(DiviApiFactory factory) => _factory = factory;

    private async Task<(HttpClient Client, int MemberId)> NewIssuerAsync()
    {
        var id = await _factory.CreateMemberAsync(Roles.IssuerId, EthECKey.GenerateKey().GetPublicAddress());
        return (_factory.CreateClientAs(id, Roles.IssuerId), id);
    }

    private static string NewOwnerAddress() => EthECKey.GenerateKey().GetPublicAddress();

    [Fact]
    public async Task Pdf_upload_is_issued_persisted_and_listed()
    {
        var (issuer, issuerId) = await NewIssuerAsync();
        var owner = NewOwnerAddress();

        var upload = await TestDocuments.IssuePdfAsync(issuer, owner);
        var hash = upload.GetString("hash");
        Assert.StartsWith("0x", hash);
        Assert.Equal(66, hash.Length);
        Assert.StartsWith("QmTest", upload.GetString("cid"));

        var byOwner = await issuer.GetAsync($"/api/documents/owner/{owner}");
        await byOwner.AssertStatusAsync(HttpStatusCode.OK);
        var item = Assert.Single((await byOwner.ReadJsonAsync()).EnumerateArray());
        Assert.Equal(hash, item.GetString("hash"));
        Assert.Equal(1, item.GetProperty("status").GetByte());
        Assert.Equal(2, item.GetProperty("documentType").GetByte());
        Assert.Equal(owner.ToLowerInvariant(), item.GetString("ownerAddress"));
        Assert.Equal(issuerId, item.GetProperty("issuedByMemberId").GetInt32());
        Assert.Equal(FakeBlockchainService.HotWalletAddress, item.GetString("issuer"));

        var byIssuer = await issuer.GetAsync($"/api/documents/issuer/{FakeBlockchainService.HotWalletAddress}");
        await byIssuer.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Contains((await byIssuer.ReadJsonAsync()).EnumerateArray(), d => d.GetString("hash") == hash);

        var mine = await issuer.GetAsync("/api/documents/issued-by-me");
        await mine.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Contains((await mine.ReadJsonAsync()).EnumerateArray(), d => d.GetString("hash") == hash);
    }

    [Fact]
    public async Task Uploading_same_pdf_twice_is_reported_as_duplicate()
    {
        var (issuer, _) = await NewIssuerAsync();
        var owner = NewOwnerAddress();
        var pdf = TestDocuments.NewPdfBytes();
        await TestDocuments.IssuePdfAsync(issuer, owner, pdf);

        var again = await issuer.PostAsync("/api/documents/upload-document", TestDocuments.PdfForm(pdf, owner));
        await again.AssertStatusAsync(HttpStatusCode.OK);
        var body = await again.ReadJsonAsync();
        Assert.True(body.GetProperty("txHash").ValueKind == System.Text.Json.JsonValueKind.Null);
        Assert.Contains("już istnieje", body.GetString("message"));
    }

    [Fact]
    public async Task Education_is_issued_as_metadata_without_pdf()
    {
        var (issuer, _) = await NewIssuerAsync();
        var owner = NewOwnerAddress();

        var upload = await issuer.PostAsync("/api/documents/upload-document", TestDocuments.MetadataForm(owner));
        await upload.AssertStatusAsync(HttpStatusCode.OK);
        var body = await upload.ReadJsonAsync();
        var hash = body.GetString("hash");
        Assert.Equal($"meta:{hash}", body.GetString("cid"));

        var item = Assert.Single((await (await issuer.GetAsync($"/api/documents/owner/{owner}")).ReadJsonAsync()).EnumerateArray());
        Assert.Equal(0, item.GetProperty("documentType").GetByte());
        Assert.Equal("Computer Science", item.GetString("title"));

        var file = await issuer.GetAsync($"/api/documents/{hash}/file");
        await file.AssertStatusAsync(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Upload_requires_issuer_role()
    {
        var owner = NewOwnerAddress();

        var anonymous = await _factory.CreateClient()
            .PostAsync("/api/documents/upload-document", TestDocuments.PdfForm(TestDocuments.NewPdfBytes(), owner));
        await anonymous.AssertStatusAsync(HttpStatusCode.Unauthorized);

        var user = await _factory.LoginWithWalletAsync();
        var forbidden = await user.Client
            .PostAsync("/api/documents/upload-document", TestDocuments.PdfForm(TestDocuments.NewPdfBytes(), owner));
        await forbidden.AssertStatusAsync(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Upload_validates_input()
    {
        var (issuer, _) = await NewIssuerAsync();
        var owner = NewOwnerAddress();

        var notPdf = new MultipartFormDataContent();
        var text = new ByteArrayContent("hello"u8.ToArray());
        text.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/plain");
        notPdf.Add(text, "file", "notes.txt");
        notPdf.Add(new StringContent(TestDocuments.LicensesType), "documentType");
        notPdf.Add(new StringContent(owner), "owner");
        await (await issuer.PostAsync("/api/documents/upload-document", notPdf)).AssertStatusAsync(HttpStatusCode.BadRequest);

        var missingFile = new MultipartFormDataContent
        {
            { new StringContent(TestDocuments.LicensesType), "documentType" },
            { new StringContent(owner), "owner" },
        };
        await (await issuer.PostAsync("/api/documents/upload-document", missingFile)).AssertStatusAsync(HttpStatusCode.BadRequest);

        var unknownType = TestDocuments.PdfForm(TestDocuments.NewPdfBytes(), owner, documentType: "Passport");
        await (await issuer.PostAsync("/api/documents/upload-document", unknownType)).AssertStatusAsync(HttpStatusCode.BadRequest);

        var educationWithoutTitle = TestDocuments.MetadataForm(owner, title: null);
        await (await issuer.PostAsync("/api/documents/upload-document", educationWithoutTitle)).AssertStatusAsync(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Verify_reports_authentic_unknown_and_revoked_documents()
    {
        var (issuer, issuerId) = await NewIssuerAsync();
        var pdf = TestDocuments.NewPdfBytes();
        var hash = await TestDocuments.IssuePdfHashAsync(issuer, NewOwnerAddress(), pdf);
        var anonymous = _factory.CreateClient();

        var authentic = await anonymous.PostAsync("/api/documents/verify-document", TestDocuments.VerifyForm(pdf));
        await authentic.AssertStatusAsync(HttpStatusCode.OK);
        var ok = await authentic.ReadJsonAsync();
        Assert.Equal(hash, ok.GetString("hash"));
        Assert.True(ok.GetProperty("isAuthentic").GetBoolean());
        Assert.False(ok.GetProperty("isRevoked").GetBoolean());
        Assert.Equal(1, ok.GetProperty("status").GetByte());
        Assert.Equal(issuerId, ok.GetProperty("issuedByMemberId").GetInt32());
        Assert.False(string.IsNullOrEmpty(ok.GetString("transactionHash")));

        var unknown = await anonymous.PostAsync("/api/documents/verify-document", TestDocuments.VerifyForm(TestDocuments.NewPdfBytes()));
        var missing = await unknown.ReadJsonAsync();
        Assert.False(missing.GetProperty("isAuthentic").GetBoolean());
        Assert.Equal(System.Text.Json.JsonValueKind.Null, missing.GetProperty("status").ValueKind);

        await (await issuer.DeleteAsync($"/api/documents/{hash}/revoke")).AssertStatusAsync(HttpStatusCode.NoContent);

        var revoked = await (await anonymous.PostAsync("/api/documents/verify-document", TestDocuments.VerifyForm(pdf))).ReadJsonAsync();
        Assert.False(revoked.GetProperty("isAuthentic").GetBoolean());
        Assert.True(revoked.GetProperty("isRevoked").GetBoolean());
        Assert.Equal(2, revoked.GetProperty("status").GetByte());
    }

    [Fact]
    public async Task Revoke_enforces_issuer_ownership_and_is_not_repeatable()
    {
        var (issuer, _) = await NewIssuerAsync();
        var (otherIssuer, _) = await NewIssuerAsync();
        var owner = NewOwnerAddress();
        var hash = await TestDocuments.IssuePdfHashAsync(issuer, owner);

        await (await otherIssuer.DeleteAsync($"/api/documents/{hash}/revoke")).AssertStatusAsync(HttpStatusCode.Forbidden);

        await (await issuer.DeleteAsync($"/api/documents/{hash}/revoke")).AssertStatusAsync(HttpStatusCode.NoContent);
        await (await issuer.DeleteAsync($"/api/documents/{hash}/revoke")).AssertStatusAsync(HttpStatusCode.Conflict);

        var item = Assert.Single((await (await issuer.GetAsync($"/api/documents/owner/{owner}")).ReadJsonAsync()).EnumerateArray());
        Assert.Equal(2, item.GetProperty("status").GetByte());

        await (await issuer.DeleteAsync("/api/documents/0xdeadbeef/revoke")).AssertStatusAsync(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Admin_can_revoke_any_document()
    {
        var (issuer, _) = await NewIssuerAsync();
        var hash = await TestDocuments.IssuePdfHashAsync(issuer, NewOwnerAddress());
        var adminId = await _factory.CreateMemberAsync(Roles.AdminId, NewOwnerAddress());

        var response = await _factory.CreateClientAs(adminId, Roles.AdminId).DeleteAsync($"/api/documents/{hash}/revoke");
        await response.AssertStatusAsync(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Pdf_file_is_forbidden_for_unrelated_member()
    {
        var (issuer, _) = await NewIssuerAsync();
        var hash = await TestDocuments.IssuePdfHashAsync(issuer, NewOwnerAddress());
        var stranger = await _factory.LoginWithWalletAsync();

        var response = await stranger.Client.GetAsync($"/api/documents/{hash}/file");
        await response.AssertStatusAsync(HttpStatusCode.Forbidden);
    }
}
