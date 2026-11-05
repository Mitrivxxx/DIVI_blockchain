using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace backend.Tests.Infrastructure;

public static class TestDocuments
{
    public const string LicensesType = "Licenses and certificates";

    public static byte[] NewPdfBytes() =>
        Encoding.UTF8.GetBytes($"%PDF-1.4\n% divi test {Guid.NewGuid():N}\n%%EOF");

    public static MultipartFormDataContent PdfForm(byte[] pdf, string owner, string documentType = LicensesType)
    {
        var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(pdf);
        file.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        form.Add(file, "file", "diploma.pdf");
        form.Add(new StringContent(documentType), "documentType");
        form.Add(new StringContent(owner), "owner");
        return form;
    }

    public static MultipartFormDataContent MetadataForm(
        string owner,
        string documentType = "Education",
        string? title = "Computer Science",
        string periodFrom = "2020-10-01",
        string periodTo = "2024-06-30")
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent(documentType), "documentType" },
            { new StringContent(owner), "owner" },
            { new StringContent(periodFrom), "periodFrom" },
            { new StringContent(periodTo), "periodTo" },
        };

        if (title is not null)
        {
            form.Add(new StringContent(title), "title");
        }

        return form;
    }

    public static MultipartFormDataContent VerifyForm(byte[] pdf)
    {
        var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(pdf);
        file.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        form.Add(file, "file", "check.pdf");
        return form;
    }

    /// <summary>Issues a PDF credential and returns the upload response body.</summary>
    public static async Task<JsonElement> IssuePdfAsync(HttpClient issuerClient, string owner, byte[]? pdf = null)
    {
        var response = await issuerClient.PostAsync("/api/documents/upload-document", PdfForm(pdf ?? NewPdfBytes(), owner));
        await response.AssertStatusAsync(HttpStatusCode.OK);
        var body = await response.ReadJsonAsync();
        Assert.False(string.IsNullOrEmpty(body.GetProperty("txHash").GetString()), $"Upload not issued: {body}");
        return body;
    }

    public static async Task<string> IssuePdfHashAsync(HttpClient issuerClient, string owner, byte[]? pdf = null) =>
        (await IssuePdfAsync(issuerClient, owner, pdf)).GetString("hash");

    public static IEnumerable<JsonElement> AllSectionItems(JsonElement wallet) =>
        wallet.GetProperty("sections").EnumerateArray().SelectMany(s => s.GetProperty("items").EnumerateArray());
}
